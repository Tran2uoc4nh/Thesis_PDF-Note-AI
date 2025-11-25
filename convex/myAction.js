import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { action } from "./_generated/server.js";
import { TaskType } from "@google/generative-ai";
import { v } from "convex/values";

// Ingest (Chuyển PDF thành Vector Embedding)
// export const ingest = action({
//     args: {
//         splitText: v.any(),
//         fileId: v.string(),
//         metadata: v.optional(v.any())
//     },
//     handler: async (ctx, args) => {
//         await ConvexVectorStore.fromTexts(
//             args.splitText,
//             { fileId: args.fileId },
//             new GoogleGenerativeAIEmbeddings({
//                 apiKey: process.env.GEMINI_API_KEY,
//                 model: "gemini-embedding-001",
//                 taskType: TaskType.RETRIEVAL_DOCUMENT,
//                 title: "Document title",
//             }),
//             { ctx }
//         );
//         return 'Completed...'
//     },
// });


// Search (Tìm kiếm trong Vector Embedding)
export const search = action({
    args: {
        query: v.string(),
        fileId: v.string()
    },
    handler: async (ctx, args) => {
        try {
            const vectorStore = new ConvexVectorStore(
                new GoogleGenerativeAIEmbeddings({
                    apiKey: process.env.GEMINI_API_KEY,
                    model: "text-embedding-004",
                    taskType: TaskType.RETRIEVAL_QUERY,

                }),
                { ctx }
            );

            // 1. Generate multiple query variations using Gemini
            const queryVariations = await generateQueryVariations(args.query);
            console.log('Query variations:', queryVariations);

            // 2. Search with all variations
            const allResults = [];
            const seenIds = new Set();

            for (const query of queryVariations) {
                console.log(`Searching with: "${query}"`);
                const results = await vectorStore.similaritySearch(query, 15);

                // Filter by fileId hiện tại và loại bỏ các kết quả trùng lặp
                results.forEach(result => {
                    const id = `${result.metadata.page}-${result.pageContent.substring(0, 50)}`;
                    if (result.metadata.fileId === args.fileId && !seenIds.has(id)) {
                        seenIds.add(id);
                        allResults.push(result);
                    }
                });
            }

            console.log('Total unique results:', allResults.length);

            // 3. Sort by relevance and return top 10
            const topResults = allResults.slice(0, 30);

            return JSON.stringify(topResults);


        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    },
});

// Hàm generate query variations
async function generateQueryVariations(originalQuery) {
    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an AI assistant helping to improve document search.
  
        Original question: ${originalQuery}

        Generate 2 alternative versions of this question that:
        1. Use different wording but ask for the same information
        2. Include synonyms and related terms (e.g., "definition" → "concept", "meaning", "explanation")
        3. For questions asking for "all" or "list", also create variations that search for individual items
        4. Consider both English and Vietnamese terms if relevant

        Provide ONLY 2 alternative questions, one per line. Do NOT include numbering, bullets, or explanations.`;


        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse variations
        const lines = response.split('\n').filter(line => line.trim().length > 0);
        const variations = [
            originalQuery,  // Always include original
            ...lines.slice(0, 2)  // Add up to 2 variations
        ];

        return variations;

    } catch (error) {
        console.error('Error generating variations:', error);
        // Fallback: return original query only
        return [originalQuery];
    }
}


// Search images by analyzing uploaded image
export const searchImageInPdf = action({
    args: {
        imageBase64: v.string(),
        fileId: v.string()
    },
    handler: async (ctx, args) => {
        try {
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

            // Step 1: Generate description from pasted image
            const visionModel = genAI.getGenerativeModel({
                model: "gemini-2.5-flash"
            });

            const descriptionPrompt = `Analyze this image and provide a detailed description. 
            Describe:
            - What objects, people, or elements are in the image
            - Colors, shapes, patterns
            - Any text visible in the image
            - The overall context or scene
            
            Provide a clear, searchable description ONLY in 2-3 sentences.`;

            const result = await visionModel.generateContent([
                descriptionPrompt,
                {
                    inlineData: {
                        data: args.imageBase64,
                        mimeType: "image/jpeg"
                    }
                }
            ]);

            const imageDescription = result.response.text();
            console.log("Generated description:", imageDescription);

            // Step 2: Search in documents table for similar images
            const vectorStore = new ConvexVectorStore(
                new GoogleGenerativeAIEmbeddings({
                    apiKey: process.env.GEMINI_API_KEY,
                    model: "text-embedding-004",
                    taskType: TaskType.RETRIEVAL_QUERY,
                }),
                { ctx }
            );

            // Search for similar images
            const searchResults = await vectorStore.similaritySearch(imageDescription, 10);

            // Filter only image type documents from this fileId
            const imageResults = searchResults.filter(result =>
                result.metadata.fileId === args.fileId &&
                result.metadata.source === 'gemini-vision'
            );

            console.log(`Found ${imageResults.length} matching images`);

            return {
                description: imageDescription,
                matches: imageResults.map(result => ({
                    page: extractPageFromContent(result.pageContent),
                    description: cleanImageDescription(result.pageContent),
                    type: result.metadata.visualType || 'image',
                    score: result.score
                }))
            };

            // Helper function để extract page number từ content
            function extractPageFromContent(content) {
                const match = content.match(/\[IMAGE Page (\d+)\]/);
                return match ? parseInt(match[1]) : null;
            }

            // Helper function để clean description
            function cleanImageDescription(content) {
                return content.replace(/^\[IMAGE Page \d+\]:\s*/i, '').trim();
            }

        } catch (error) {
            console.error('Image search error:', error);
            throw error;
        }
    }
});