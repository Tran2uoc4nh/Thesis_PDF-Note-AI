import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { action } from "./_generated/server.js";
import { TaskType } from "@google/generative-ai";
import { v } from "convex/values";

// Ingest
export const ingest = action({
    args: {
        splitText: v.any(),
        fileId: v.string(),
        metadata: v.optional(v.any())
    },
    handler: async (ctx, args) => {
        await ConvexVectorStore.fromTexts(
            args.splitText,
            { fileId: args.fileId },
            new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
                model: "text-embedding-004", // 768 dimensions
                taskType: TaskType.RETRIEVAL_DOCUMENT,
                title: "Document title",
            }),
            { ctx }
        );
        return 'Completed...'
    },
});

// Search
export const search = action({
    args: {
        query: v.string(),
        fileId: v.string()
    },
    handler: async (ctx, args) => {
        try {
            const vectorStore = new ConvexVectorStore(
                new GoogleGenerativeAIEmbeddings({
                    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
                    model: "text-embedding-004",
                    taskType: TaskType.RETRIEVAL_DOCUMENT,
                    title: "Document title",
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
                const results = await vectorStore.similaritySearch(query, 5);

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
            const topResults = allResults.slice(0, 10);

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

        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an AI assistant. Generate 2 alternative versions of the following question to help retrieve relevant documents. The alternatives should use different wording but ask for the same information.
  
        Original question: ${originalQuery}
  
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