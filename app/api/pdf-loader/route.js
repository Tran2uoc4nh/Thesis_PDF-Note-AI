import { NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


// Ước tính token mà text có thể chiếm
function estimateTokens(text) {
    if (!text) return 0;

    const charCount = text.length;
    const wordCount = text.split(/\s+/).length;

    // Estimate: avg of character-based and word-based
    const charBasedTokens = charCount / 3.5;
    const wordBasedTokens = wordCount * 1.3;

    return Math.ceil((charBasedTokens + wordBasedTokens) / 2);
}


export async function GET(req) {
    const reqUrl = req.url
    const { searchParams } = new URL(reqUrl)
    const pdfUrl = searchParams.get('pdfUrl')

    try {
        // 1. Load PDF
        const response = await fetch(pdfUrl);
        const data = await response.blob();
        const loader = new WebPDFLoader(data);
        const docs = await loader.load();


        // 2. Clean docs / Lọc trang trống
        const cleanedDocs = [];
        for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            const text = (doc.pageContent || "").trim();

            if (!text || text.length < 10) {
                console.log(`Skipping empty page ${i + 1}`);
                continue;
            }

            doc.metadata = {
                ...doc.metadata,
                page: doc.metadata.page || i + 1,
            };

            cleanedDocs.push(doc);
        }

        console.log(`Kept ${cleanedDocs.length} of ${docs.length} pages`);

        // 3. Smart text splitting
        const separators = [
            "\n\n## ", "\n\n# ", "\n\n",
            "\n", ". ", "? ", "! ", " ", ""
        ];

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 200,
            separators: separators,
            lengthFunction: estimateTokens,
            keepSeparator: false,
        });

        const chunks = await textSplitter.splitDocuments(cleanedDocs);

        // 4. Filter và add metadata
        const splitterList = [];
        chunks.forEach((chunk, index) => {
            const content = chunk.pageContent || "";

            splitterList.push({
                text: content,
                metadata: {
                    ...chunk.metadata,
                    chunk_id: index,
                }
            });
        });

        console.log('Chunks created:', chunks.length);
        console.log('Valid chunks after filtering:', splitterList.length);
        console.log('First chunk preview:', splitterList[0]?.text.substring(0, 100));

        return NextResponse.json({
            result: splitterList.map(c => c.text),
            metadata: {
                totalPages: docs.length,
                cleanedPages: cleanedDocs.length,
                totalChunks: splitterList.length,
            }
        });

    } catch (error) {
        console.error('PDF processing error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }



}