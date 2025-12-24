"use node";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);


const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const visionModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
});

// ===== ƯỚC TÍNH TOKEN (GIỐNG PDF-LOADER) =====
function estimateTokens(text) {
    if (!text) return 0;
    const charCount = text.length;
    const wordCount = text.split(/\s+/).length;
    const charBasedTokens = charCount / 3.5;
    const wordBasedTokens = wordCount * 1.3;
    return Math.ceil((charBasedTokens + wordBasedTokens) / 2);
}

// ===== RECURSIVE CHARACTER TEXT SPLITTER (GIỐNG PDF-LOADER) =====
function splitTextIntoChunks(text, chunkSize = 800, overlap = 200) {
    if (!text || estimateTokens(text) <= chunkSize) {
        return text ? [text] : [];
    }

    // Separators theo thứ tự ưu tiên (giống pdf-loader)
    const separators = [
        "\n\n## ", "\n\n# ", "\n\n",  // Headers & Paragraphs
        "\n", ". ", "? ", "! ",        // Lines & Sentences
        " ", ""                         // Words & Characters
    ];

    const chunks = [];
    let currentChunk = "";

    // Tìm separator phù hợp nhất
    function findBestSeparator(str) {
        for (const sep of separators) {
            if (sep && str.includes(sep)) {
                return sep;
            }
        }
        return "";
    }

    // Split text bằng separator tốt nhất
    const bestSep = findBestSeparator(text);
    const parts = bestSep ? text.split(bestSep) : text.split("");

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const potentialChunk = currentChunk
            ? currentChunk + bestSep + part
            : part;

        if (estimateTokens(potentialChunk) <= chunkSize) {
            currentChunk = potentialChunk;
        } else {
            // Lưu chunk hiện tại
            if (currentChunk.trim().length > 10) {
                chunks.push(currentChunk.trim());
            }

            // Bắt đầu chunk mới với overlap
            if (overlap > 0 && currentChunk.length > overlap) {
                // Lấy phần cuối của chunk cũ làm overlap
                const overlapText = currentChunk.slice(-overlap);
                currentChunk = overlapText + bestSep + part;
            } else {
                currentChunk = part;
            }

            // Nếu part vẫn quá dài, recursive split
            if (estimateTokens(currentChunk) > chunkSize) {
                const subChunks = splitTextIntoChunks(currentChunk, chunkSize, overlap);
                chunks.push(...subChunks.slice(0, -1));
                currentChunk = subChunks[subChunks.length - 1] || "";
            }
        }
    }

    // Đừng quên chunk cuối
    if (currentChunk.trim().length > 10) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

export const ingestPdfWithImages = action({
    args: { pdfUrl: v.string(), fileId: v.string() },
    handler: async (ctx, args) => {
        const startTime = Date.now();
        console.log(`\n========== INGEST FINAL (Sequential Fast) ==========`);

        // 1. Tải file & Load
        console.log("--- Step 1: Loading PDF ---");
        const response = await fetch(args.pdfUrl);
        if (!response.ok) throw new Error("Download failed");
        const arrayBuffer = await response.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = srcDoc.getPageCount();
        console.log(`✓ PDF Loaded: ${totalPages} pages`);

        // CẤU HÌNH VISION (Đọc PDF)
        // Phần này không bị lỗi nên giữ nguyên tốc độ cao
        let VISION_CONFIG;
        if (totalPages < 80) {
            VISION_CONFIG = { BATCH: 100, SLEEP: 0 }; // File nhỏ: Max tốc độ
        } else {
            VISION_CONFIG = { BATCH: 4, SLEEP: 2000 }; // File to: An toàn
        }

        // 2. Chuẩn bị chunks
        const CHUNK_SIZE = 10;
        const tasks = [];
        for (let i = 0; i < totalPages; i += CHUNK_SIZE) {
            tasks.push({
                startPage: i,
                endPage: Math.min(i + CHUNK_SIZE, totalPages) - 1
            });
        }

        // ============================================
        // STEP 2: VISION PROCESSING (Giữ nguyên)
        // ============================================
        const results = [];
        console.log(`--- Step 2: Vision Processing (${tasks.length} chunks) ---`);

        for (let i = 0; i < tasks.length; i += VISION_CONFIG.BATCH) {
            const batch = tasks.slice(i, i + VISION_CONFIG.BATCH);
            console.log(`🚀 Vision Batch: ${batch.length} chunks...`);

            const batchResults = await Promise.all(
                batch.map(task => processPdfChunk(srcDoc, task.startPage, task.endPage))
            );
            results.push(...batchResults);

            if (i + VISION_CONFIG.BATCH < tasks.length && VISION_CONFIG.SLEEP > 0) {
                await new Promise(resolve => setTimeout(resolve, VISION_CONFIG.SLEEP));
            }
        }

        // 3. Gộp kết quả
        console.log("--- Step 3: Merging Results ---");
        const allDocumentsToSave = [];
        results.forEach((res, index) => {
            if (!res) return;
            if (index === 0 && res.documentMetadata) {
                // SỬA ĐOẠN NÀY: Thêm tableOfContents vào content
                const meta = res.documentMetadata;
                const tocContent = meta.tableOfContents ? `\n\nTABLE OF CONTENTS:\n${meta.tableOfContents}` : "";
                allDocumentsToSave.push({
                    type: "metadata",
                    content: `INFO:\nTitle: ${meta.title}\nSummary: ${meta.summary || 'N/A'}${tocContent}`,
                    page: 0,
                    metadata: { ...res.documentMetadata, fileId: args.fileId, isMetadata: true }
                });
            }
            // res.pages?.forEach(p => {
            //     const realPageNum = p.pageNumber;
            //     if (p.textContent) {
            //         allDocumentsToSave.push({
            //             type: "text",
            //             content: p.textContent,
            //             page: realPageNum,
            //             metadata: { source: 'gemini-ocr', fileId: args.fileId, page: realPageNum }
            //         });
            //     }
            //     p.visualElements?.forEach(v => {
            //         allDocumentsToSave.push({
            //             type: "image",
            //             content: `[IMAGE Page ${realPageNum}]: ${v.description}`,
            //             page: realPageNum,
            //             metadata: { source: 'gemini-vision', type: v.type, fileId: args.fileId }
            //         });
            //     });
            // });
            // MỚI (thay thế dòng 89-98):
            res.pages?.forEach(p => {
                const realPageNum = p.pageNumber;
                if (p.textContent) {
                    // ===== CHIA TEXT THÀNH CHUNKS NHỎ =====
                    const textChunks = splitTextIntoChunks(p.textContent, 800, 200);
                    textChunks.forEach((chunk, chunkIndex) => {
                        allDocumentsToSave.push({
                            type: "text",
                            content: chunk,
                            page: realPageNum,
                            metadata: {
                                source: 'gemini-ocr',
                                fileId: args.fileId,
                                page: realPageNum,
                                chunk_id: chunkIndex,
                                total_chunks: textChunks.length
                            }
                        });
                    });
                }
                p.visualElements?.forEach(v => {
                    allDocumentsToSave.push({
                        type: "image",
                        content: `[IMAGE Page ${realPageNum}]: ${v.description}`,
                        page: realPageNum,
                        metadata: { source: 'gemini-vision', type: v.type, fileId: args.fileId }
                    });
                });
            });
        });

        // ============================================
        // STEP 4: SAVING (THAY ĐỔI CHIẾN THUẬT: SEQUENTIAL)
        // ============================================
        // Không dùng Promise.all nữa. Lưu từng cái một nhưng nghỉ cực ít.
        // Cách này đảm bảo không bao giờ bị Burst Limit.
        console.log(`--- Step 4: Saving ${allDocumentsToSave.length} items (Sequential Fast) ---`);

        let savedCount = 0;

        // Dùng vòng lặp for...of để chạy tuần tự
        for (const doc of allDocumentsToSave) {
            try {
                const embeddingResp = await embeddingModel.embedContent(doc.content);
                await ctx.runMutation(internal.documents.saveDocument, {
                    type: doc.type,
                    text: doc.content,
                    embedding: embeddingResp.embedding.values,
                    metadata: doc.metadata
                });
                savedCount++;

                if (savedCount % 10 === 0) process.stdout.write(`.`); // In dấu chấm cho gọn log

                // NGHỈ CỰC NGẮN (0.2s) SAU MỖI CÁI
                // Giống như bắn tỉa: Pằng... Pằng... Pằng...
                // Thay vì súng máy: Pằng pằng pằng pằng (Bị chặn)
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (err) {
                console.error(`\nError saving index ${savedCount}:`, err.message);
                // Nếu vẫn bị lỗi thì nghỉ lâu hơn xíu rồi chạy tiếp
                if (err.message.includes('429')) {
                    console.log("⚠️ Limit hit. Pausing 5s...");
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`\n========== DONE in ${duration}s : ${savedCount} saved ==========`);
        return { success: true, saved: savedCount, duration };
    }
});


// ===== HÀM WORKER XỬ LÝ 1 MẢNH PDF =====
// async function processPdfChunk(srcDoc, startPage, endPage) {
//     try {
//         const subDoc = await PDFDocument.create();
//         const indices = [];
//         for (let j = startPage; j <= endPage; j++) indices.push(j);

//         const copiedPages = await subDoc.copyPages(srcDoc, indices);
//         copiedPages.forEach((page) => subDoc.addPage(page));

//         const pdfBytes = await subDoc.save();
//         const base64Chunk = Buffer.from(pdfBytes).toString('base64');

//         // Logic Prompt: Chỉ lấy Metadata ở chunk đầu tiên
//         const isFirstChunk = startPage === 0;

//         const prompt = `
//         Analyze this PDF chunk (Pages ${startPage + 1} to ${endPage + 1}).

//         ${isFirstChunk ? `
//         1. **Document Metadata** (look at cover page, title page, headers):
//            - Title: The main title of the document
//            - Author: Who wrote/created this document (look for "By", "Author", "Written by", student name)
//            - Date/Year: When was it created
//            - Institution: School, university, organization
//            - Document Type: thesis, report, paper, book, manual, etc.
//            - Degree: If it's a thesis, what degree (Bachelor, Master, PhD)
//            - Department: Which department/school
//         ` : `
//         1. **Document Metadata**: IGNORE THIS STEP (This is not the first chunk).
//         `}

//         2. **Page Content**:
//            - All text from each page
//            - Visual elements (charts, diagrams, tables, images, graphs, figures)

//         Return JSON with this exact structure:  
//         {
//             ${isFirstChunk ? `
//             "documentMetadata": {
//                 "title": "Full document title",
//                 "author": "Author full name",
//                 "year": "Year",
//                 "institution": "Institution name",
//                 "department": "Department name",
//                 "documentType": "thesis|report|paper|etc",
//                 "degree": "Bachelor|Master|PhD or empty",
//                 "location": "City, Country"
//             },
//             ` : ""} 
//             "pages": [
//                 {
//                 "pageNumber": 1, // USE REAL PAGE NUMBER (Start from ${startPage + 1})
//                 "textContent": "All text from page...",
//                 "visualElements": [
//                     {
//                     "type": "chart|diagram|table|image|graph|figure",
//                     "description": "Describe the content of this visual element in detail."
//                     }
//                 ]
//                 }
//             ]
//         }

//         CRITICAL RULES:
//         ${isFirstChunk ? `- Look carefully at the FIRST PAGE for metadata` : ""}
//         - Extract metadata fields even if you need to infer from context.
//         - Keep original text language.
//         - Describe visuals in English.

//         **JSON FORMATTING RULES:**
//         - Output raw JSON only. DO NOT use markdown code blocks.
//         - Escape all double quotes within strings (e.g., use \\" instead of ").
//         - Do not include trailing commas.
//         - Ensure "pageNumber" corresponds to the actual document page number provided in instructions.
//         `;

//         // Gọi Gemini (Tạo instance mới để tránh xung đột)
//         const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
//             model: "gemini-2.5-flash",
//             generationConfig: { responseMimeType: "application/json" }
//         });

//         const result = await model.generateContent([
//             { inlineData: { data: base64Chunk, mimeType: "application/pdf" } },
//             prompt
//         ]);

//         const responseText = result.response.text();

//         // Clean & Parse JSON
//         try {
//             const cleanedResponse = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
//             return JSON.parse(cleanedResponse);
//         } catch (parseError) {
//             console.error(`JSON Parse Error at chunk ${startPage}-${endPage}:`, parseError.message);
//             return { pages: [] };
//         }
//     } catch (e) {
//         console.error(`Error processing chunk ${startPage}-${endPage}:`, e.message);
//         return { pages: [] };
//     }
// }

// ===== HÀM WORKER XỬ LÝ 1 MẢNH PDF (ĐÃ NÂNG CẤP XỬ LÝ MỤC LỤC) =====
async function processPdfChunk(srcDoc, startPage, endPage) {
    try {
        const subDoc = await PDFDocument.create();
        const indices = [];
        for (let j = startPage; j <= endPage; j++) indices.push(j);
        const copiedPages = await subDoc.copyPages(srcDoc, indices);
        copiedPages.forEach((page) => subDoc.addPage(page));
        const pdfBytes = await subDoc.save();
        const base64Chunk = Buffer.from(pdfBytes).toString('base64');

        // Logic Prompt: Chỉ lấy Metadata ở chunk đầu tiên
        const isFirstChunk = startPage === 0;

        const prompt = `
        Analyze this PDF chunk (Pages ${startPage + 1} to ${endPage + 1}).

        ${isFirstChunk ? `
        1. **Document Metadata & Structure** (look at cover page, title page, headers):
           - Title, Author, Year, Institution, Document Type, Degree, Department
           - **Table of Contents (TOC)**: Look for the "Table of Contents" or "Index" section. Extract the FULL structure (Chapter titles, main sections) into a single string. If it spans multiple pages in this chunk, COMBINE them.
        ` : `
        1. **Document Metadata**: IGNORE THIS STEP (This is not the first chunk).
        `}

        2. **Page Content**:
           - All text from each page.
           - Visual elements (charts, diagrams, tables, images, graphs, figures).

        Return JSON with this exact structure:  
        {
            ${isFirstChunk ? `
            "documentMetadata": {
                "title": "Full document title",
                "author": "Author full name",
                "year": "Year",
                "institution": "Institution name",
                "department": "Department name",
                "documentType": "thesis|report|paper|etc",
                "degree": "Bachelor|Master|PhD or empty",
                "location": "City, Country",
                "tableOfContents": "FULL extracted text of the Table of Contents (combine multiple pages if needed)" 
            },
            ` : ""} 
            "pages": [
                {
                "pageNumber": ${startPage + 1}, 
                "textContent": "All text from page...",
                "visualElements": [ { "type": "chart|diagram|table|image|graph|figure", "description": "..." } ]
                }
            ]
        }

        CRITICAL RULES:
        ${isFirstChunk ? `- Look carefully at the FIRST PAGE for metadata` : ""}
        - Extract metadata fields even if you need to infer from context.
        - **IMPORTANT:** The "tableOfContents" field in metadata must contain the complete list of chapters/sections found in this chunk.
        - Keep original text language.
        - **PAGE NUMBERING**: The first page in this chunk is page ${startPage + 1}. Number pages sequentially from there (${startPage + 1}, ${startPage + 2}, ${startPage + 3}...).
        **JSON FORMATTING RULES:**
        - Output raw JSON only. DO NOT use markdown code blocks.
        - Escape all double quotes within strings (e.g., use \\" instead of ").
        `;

        // ... (Phần gọi model và parse JSON giữ nguyên) ...
        const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent([
            { inlineData: { data: base64Chunk, mimeType: "application/pdf" } },
            prompt
        ]);
        const responseText = result.response.text();
        try {
            const cleanedResponse = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleanedResponse);
        } catch (parseError) {
            return { pages: [] };
        }
    } catch (e) {
        return { pages: [] };
    }
}