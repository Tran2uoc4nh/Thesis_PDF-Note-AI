import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Model để generate embeddings
const embeddingModel = genAI.getGenerativeModel({
    model: "gemini-embedding-001",
});

// Model để analyze PDF với vision
const visionModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {                        // ← THÊM PHẦN NÀY
        responseMimeType: "application/json",  // ← JSON MODE
        temperature: 0.1,                      // ← THÊM
    }

});

// ===== HELPER: Convert ArrayBuffer to Base64 (không dùng Buffer) =====
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;

    // Process in chunks to avoid call stack size exceeded
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
        binary += String.fromCharCode.apply(null, chunk);
    }

    // Use btoa for base64 encoding (Web API, có trong Convex)
    return btoa(binary);
}

// ===== ACTION CHÍNH =====
export const ingestPdfWithImages = action({
    args: {
        pdfUrl: v.string(),
        fileId: v.string(),
    },
    handler: async (ctx, args) => {
        console.log(`\n========== CONVEX INGEST WITH MULTIMODAL START ==========`);
        console.log(`File ID: ${args.fileId}`);
        console.log(`PDF URL: ${args.pdfUrl}`);

        try {
            // 1. Download PDF từ URL
            console.log('\n--- Step 1: Downloading PDF ---');
            const response = await fetch(args.pdfUrl);

            if (!response.ok) {
                throw new Error(`Failed to download PDF: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();

            console.log(`✓ Downloaded: ${arrayBuffer.byteLength} bytes`);

            // 2. Convert to base64 (KHÔNG DÙNG BUFFER)
            console.log('\n--- Step 2: Converting to base64 ---');
            const base64Pdf = arrayBufferToBase64(arrayBuffer);
            console.log(`✓ Converted to base64: ${base64Pdf.length} characters`);

            // 3. Analyze PDF với Gemini Vision (inline data)
            console.log('\n--- Step 3: Analyzing with Gemini Vision ---');

            // const prompt = `
            // Phân tích toàn bộ file PDF này và trích xuất nội dung theo cấu trúc sau:

            // Với mỗi trang, hãy:
            // 1. Trích xuất TẤT CẢ văn bản
            // 2. Mô tả chi tiết BẤT KỲ hình ảnh, biểu đồ, bảng biểu, sơ đồ nào

            // Trả về kết quả theo định dạng JSON như sau:
            // {
            // "pages": [
            //     {
            //     "pageNumber": 1,
            //     "textContent": "Toàn bộ văn bản trang 1...",
            //     "visualElements": [
            //         {
            //         "type": "chart|diagram|table|image|graph",
            //         "description": "Mô tả chi tiết nội dung visual element này"
            //         }
            //     ]
            //     }
            // ]
            // }

            // QUY TẮC:
            // - Giữ nguyên ngôn ngữ gốc của văn bản
            // - Mô tả visual elements bằng tiếng Việt, chi tiết
            // - Nếu không có visual elements, để mảng rỗng []
            // - Output phải là JSON hợp lệ, KHÔNG thêm markdown backticks
            // `;
            const prompt = `
            Analyze this PDF document thoroughly and extract:

            1. **Document Metadata** (look at cover page, title page, headers):
            - Title: The main title of the document
            - Author: Who wrote/created this document (look for "By", "Author", "Written by", student name)
            - Date/Year: When was it created
            - Institution: School, university, organization
            - Document Type: thesis, report, paper, book, manual, etc.
            - Degree: If it's a thesis, what degree (Bachelor, Master, PhD)
            - Department: Which department/school

            2. **Page Content**:
            - All text from each page
            - Visual elements (charts, diagrams, tables, images)

            Return JSON with this exact structure:
            {
            "documentMetadata": {
                "title": "Full document title",
                "author": "Author full name",
                "year": "Year",
                "institution": "Institution name",
                "department": "Department name",
                "documentType": "thesis|report|paper|etc",
                "degree": "Bachelor|Master|PhD or empty",
                "location": "City, Country"
            },
            "pages": [
                {
                "pageNumber": 1,
                "textContent": "All text from page 1",
                "visualElements": [
                    {
                    "type": "chart|diagram|table|image|graph",
                    "description": "Describe the content of this visual element in detail."
                    }
                ]
                }
            ]
            }

            CRITICAL RULES:
            - Look carefully at the FIRST PAGE for metadata
            - For author: search for "By", "Author:", "Student:", name after title
            - Extract metadata fields even if you need to infer from context
            - If a field is not found, use empty string ""
            - Keep original text language
            - Describe visuals in English
            `;


            const result = await visionModel.generateContent([
                {
                    inlineData: {
                        data: base64Pdf,
                        mimeType: "application/pdf"
                    }
                },
                prompt
            ]);

            const responseText = result.response.text();
            console.log(`✓ Received response: ${responseText.length} characters`);

            // 4. Parse JSON
            console.log('\n--- Step 4: Parsing JSON ---');
            let extractedData;

            try {
                const cleanedResponse = responseText
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*/g, '')
                    .trim();

                extractedData = JSON.parse(cleanedResponse);
                console.log(`✓ Parsed successfully: ${extractedData.pages?.length || 0} pages`);

            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.log('Raw response (first 500 chars):', responseText.substring(0, 500));
                throw new Error(`Failed to parse JSON: ${parseError.message}`);
            }

            // 5. Convert to documents array
            // console.log('\n--- Step 5: Processing documents ---');
            // const documents = [];
            // let totalVisualElements = 0;
            console.log('\n--- Step 5: Processing document metadata ---');
            const documents = [];

            if (extractedData.documentMetadata) {
                const meta = extractedData.documentMetadata;

                // Build rich metadata text for better searchability
                const metadataTexts = [];

                // Version 1: Full formal description
                const formalDesc = `
THÔNG TIN TÀI LIỆU

Đây là tài liệu về "${meta.title || 'Không có tiêu đề'}".

Tác giả: ${meta.author || 'Không rõ'}
${meta.author ? `Tài liệu này được viết bởi ${meta.author}.` : ''}
${meta.author ? `${meta.author} là tác giả của tài liệu này.` : ''}

Loại tài liệu: ${meta.documentType || 'Không rõ'}
${meta.degree ? `Đây là luận văn ${meta.degree}.` : ''}

Tổ chức: ${meta.institution || 'Không rõ'}
${meta.department ? `Khoa/Trường: ${meta.department}` : ''}
${meta.location ? `Địa điểm: ${meta.location}` : ''}

Năm: ${meta.year || 'Không rõ'}
${meta.year ? `Tài liệu được hoàn thành vào năm ${meta.year}.` : ''}

Tiêu đề đầy đủ: ${meta.title || 'Không có'}
    `.trim();

                // Version 2: Q&A format for better search matching
                const qaFormat = `
CÂU HỎI VÀ TRẢ LỜI VỀ TÀI LIỆU:

Q: Ai là tác giả của tài liệu này?
A: Tác giả là ${meta.author || 'không rõ'}.

Q: Ai viết tài liệu này?
A: ${meta.author || 'Không rõ'} viết tài liệu này.

Q: Tên tác giả?
A: ${meta.author || 'Không rõ'}

Q: Tiêu đề tài liệu là gì?
A: "${meta.title || 'Không có tiêu đề'}"

Q: Đây là loại tài liệu gì?
A: Đây là ${meta.documentType || 'tài liệu'}${meta.degree ? ` ${meta.degree}` : ''}.

Q: Tài liệu này về chủ đề gì?
A: ${meta.title || 'Không rõ chủ đề'}

Q: Trường nào?
A: ${meta.institution || 'Không rõ'}

Q: Năm nào?
A: Năm ${meta.year || 'không rõ'}
    `.trim();

                // Add both versions as separate searchable documents
                documents.push({
                    type: "metadata",
                    content: formalDesc,
                    page: 0,
                    metadata: {
                        source: 'document-metadata',
                        contentType: 'metadata-formal',
                        isDocumentInfo: true,
                        ...meta
                    }
                });

                documents.push({
                    type: "metadata",
                    content: qaFormat,
                    page: 0,
                    metadata: {
                        source: 'document-metadata',
                        contentType: 'metadata-qa',
                        isDocumentInfo: true,
                        ...meta
                    }
                });

                console.log('✓ Document metadata extracted:');
                console.log(`  - Title: ${meta.title || 'N/A'}`);
                console.log(`  - Author: ${meta.author || 'N/A'}`);
                console.log(`  - Institution: ${meta.institution || 'N/A'}`);
                console.log(`  - Year: ${meta.year || 'N/A'}`);
            } else {
                console.log('⚠️ No document metadata found');
            }

            // 6. Convert pages to documents (GIỮ NGUYÊN CODE CŨ)
            let totalVisualElements = 0;

            extractedData.pages?.forEach(page => {
                const pageNum = page.pageNumber || 0;

                // Add text content
                if (page.textContent && page.textContent.trim()) {
                    documents.push({
                        type: "text",
                        content: page.textContent.trim(),
                        page: pageNum,
                        metadata: {
                            source: 'gemini-extraction',
                            contentType: 'text'
                        }
                    });
                }

                // Add visual elements
                if (page.visualElements && Array.isArray(page.visualElements)) {
                    page.visualElements.forEach((element, idx) => {
                        if (element.description && element.description.trim()) {
                            documents.push({
                                type: "image",
                                content: `[${element.type || 'Visual element'} - Page ${pageNum}]\n${element.description}`,
                                page: pageNum,
                                metadata: {
                                    source: 'gemini-vision',
                                    contentType: 'visual',
                                    visualType: element.type || 'unknown',
                                    elementIndex: idx
                                }
                            });
                            totalVisualElements++;
                        }
                    });
                }
            });

            console.log(`✓ Created ${documents.length} documents`);
            console.log(`  - Text: ${documents.length - totalVisualElements}`);
            console.log(`  - Visual: ${totalVisualElements}`);

            // 6. Generate embeddings và save
            console.log('\n--- Step 6: Generating embeddings and saving ---');
            let savedCount = 0;
            let errorCount = 0;

            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];

                try {
                    console.log(`Processing ${i + 1}/${documents.length}: ${doc.type} (page ${doc.page})`);

                    // Generate embedding
                    const embeddingResult = await embeddingModel.embedContent(doc.content);
                    const embedding = embeddingResult.embedding.values;

                    // Save to database
                    await ctx.runMutation(internal.ingest.saveDocument, {
                        type: doc.type,
                        text: doc.content,
                        embedding: Array.from(embedding),
                        metadata: {
                            ...doc.metadata,
                            page: doc.page,
                            fileId: args.fileId
                        },
                    });

                    savedCount++;

                } catch (err) {
                    console.error(`  ✗ Error processing document ${i + 1}:`, err.message);
                    errorCount++;
                }

                // Rate limiting
                if (i < documents.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            console.log(`\n--- Summary ---`);
            console.log(`✓ Saved: ${savedCount}`);
            console.log(`✗ Errors: ${errorCount}`);
            console.log(`========== CONVEX INGEST COMPLETE ==========\n`);

            return {
                success: true,
                saved: savedCount,
                errors: errorCount,
                total: documents.length,
                statistics: {
                    totalPages: extractedData.pages?.length || 0,
                    textDocuments: documents.length - totalVisualElements,
                    visualDocuments: totalVisualElements
                }
            };

        } catch (error) {
            console.error('\n❌ INGEST ERROR:', error);
            console.error('Stack:', error.stack);
            throw error;
        }
    },
});

// ===== MUTATION ĐỂ LƯU VÀO DB =====
export const saveDocument = internalMutation({
    args: {
        type: v.string(),
        text: v.string(),
        embedding: v.array(v.float64()),
        metadata: v.any(),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("documents", {
            type: args.type,
            text: args.text,
            embedding: args.embedding,
            metadata: args.metadata,
            imageUrl: args.imageUrl,
        });
    },
});