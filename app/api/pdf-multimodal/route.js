import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(req) {
    console.log('\n========== GEMINI MULTIMODAL PDF PROCESSING ==========');

    try {
        // 1. Nhận PDF URL từ request
        const { pdfUrl } = await req.json();

        if (!pdfUrl) {
            return NextResponse.json({ error: 'pdfUrl is required' }, { status: 400 });
        }

        console.log('PDF URL:', pdfUrl);

        // 2. Download PDF
        console.log('\n--- Step 1: Downloading PDF ---');
        const response = await fetch(pdfUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`✓ Downloaded: ${buffer.length} bytes`);

        // 3. Save to temp file (Gemini File API cần file path)
        console.log('\n--- Step 2: Saving to temp file ---');
        const tempFilePath = join(tmpdir(), `pdf-${Date.now()}.pdf`);
        await writeFile(tempFilePath, buffer);
        console.log(`✓ Saved to: ${tempFilePath}`);

        // 4. Upload to Gemini File API
        console.log('\n--- Step 3: Uploading to Gemini ---');
        const fileManager = new GoogleAIFileManager(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: "application/pdf",
            displayName: `document-${Date.now()}.pdf`,
        });

        console.log(`✓ Uploaded to Gemini: ${uploadResult.file.name}`);
        console.log(`  URI: ${uploadResult.file.uri}`);

        // 5. Wait for file to be processed (important!)
        let file = await fileManager.getFile(uploadResult.file.name);
        while (file.state === "PROCESSING") {
            console.log('  Waiting for Gemini to process file...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") {
            throw new Error("Gemini failed to process the file");
        }

        console.log('✓ File ready for analysis');

        // 6. Analyze with Gemini
        console.log('\n--- Step 4: Analyzing with Gemini Vision ---');
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",  // hoặc "gemini-1.5-pro" nếu cần chất lượng cao hơn
        });

        const prompt = `
Phân tích toàn bộ file PDF này và trích xuất nội dung theo cấu trúc sau:

Với mỗi trang, hãy:
1. Trích xuất TẤT CẢ văn bản
2. Mô tả chi tiết BẤT KỲ hình ảnh, biểu đồ, bảng biểu, sơ đồ nào

Trả về kết quả theo định dạng JSON như sau:
{
  "pages": [
    {
      "pageNumber": 1,
      "textContent": "Toàn bộ văn bản trang 1...",
      "visualElements": [
        {
          "type": "chart|diagram|table|image|graph",
          "description": "Mô tả chi tiết nội dung visual element này, bao gồm dữ liệu, text trong hình, ý nghĩa..."
        }
      ]
    },
    {
      "pageNumber": 2,
      "textContent": "Toàn bộ văn bản trang 2...",
      "visualElements": []
    }
  ]
}

QUY TẮC QUAN TRỌNG:
- Giữ nguyên ngôn ngữ gốc của văn bản trong PDF
- Mô tả visual elements bằng tiếng Việt, chi tiết và đầy đủ
- Nếu trang không có visual elements, để mảng rỗng []
- Đảm bảo output là JSON hợp lệ, không thêm markdown backticks
- Trích xuất ĐẦY ĐỦ, không bỏ sót
`;

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri
                }
            },
            prompt
        ]);

        const responseText = result.response.text();
        console.log(`✓ Received response: ${responseText.length} characters`);

        // 7. Parse JSON
        console.log('\n--- Step 5: Parsing JSON ---');
        let extractedData;

        try {
            // Remove markdown code blocks nếu có
            const cleanedResponse = responseText
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            extractedData = JSON.parse(cleanedResponse);
            console.log(`✓ Parsed successfully: ${extractedData.pages?.length || 0} pages`);

        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Raw response (first 500 chars):', responseText.substring(0, 500));

            // Fallback
            return NextResponse.json({
                error: 'Failed to parse JSON response',
                rawResponse: responseText.substring(0, 1000),
                success: false
            }, { status: 500 });
        }

        // 8. Cleanup
        console.log('\n--- Step 6: Cleanup ---');
        try {
            await unlink(tempFilePath);
            console.log('✓ Temp file deleted');
        } catch (e) {
            console.log('Could not delete temp file:', e.message);
        }

        // Optional: Delete from Gemini (nếu muốn tiết kiệm storage)
        // await fileManager.deleteFile(uploadResult.file.name);

        console.log('\n========== PROCESSING COMPLETE ==========\n');

        // 9. Format và return
        const documents = [];
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
                            content: `[${element.type || 'Visual element'} - Trang ${pageNum}]\n${element.description}`,
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

        console.log(`\nFinal statistics:`);
        console.log(`- Total documents: ${documents.length}`);
        console.log(`- Text documents: ${documents.length - totalVisualElements}`);
        console.log(`- Visual documents: ${totalVisualElements}`);

        return NextResponse.json({
            success: true,
            documents: documents,
            statistics: {
                totalPages: extractedData.pages?.length || 0,
                totalDocuments: documents.length,
                textDocuments: documents.length - totalVisualElements,
                visualDocuments: totalVisualElements
            }
        });

    } catch (error) {
        console.error('\n❌ Error:', error);
        console.error('Stack:', error.stack);

        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
}