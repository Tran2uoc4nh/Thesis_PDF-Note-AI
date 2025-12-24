// "use node";
// import { action } from "./_generated/server";
// import { v } from "convex/values";
// import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
// import { TaskType } from "@google/generative-ai";

// export const runEvaluation = action({
//     args: {
//         fileId: v.string()
//     },
//     handler: async (ctx, args) => {
//         // Test questions - SỬA THEO NỘI DUNG PDF CỦA BẠN
//         const testQuestions = [
//             "What is the main topic of this document?",
//             "Who is the author?",
//             "What methodology was used?",
//             "What are the conclusions?"
//         ];

//         console.log('\n========== 📊 EVALUATION STARTED ==========');
//         console.log(`FileId: ${args.fileId}`);
//         console.log(`Testing ${testQuestions.length} questions\n`);

//         const vectorStore = new ConvexVectorStore(
//             new GoogleGenerativeAIEmbeddings({
//                 apiKey: process.env.GEMINI_API_KEY,
//                 model: "text-embedding-004",
//                 taskType: TaskType.RETRIEVAL_QUERY,
//             }),
//             { ctx }
//         );

//         const latencies = [];

//         for (const question of testQuestions) {
//             const start = Date.now();
//             const results = await vectorStore.similaritySearch(question, 5);
//             const filtered = results.filter(r => r.metadata.fileId === args.fileId);
//             const latency = Date.now() - start;
//             latencies.push(latency);

//             console.log(`✓ "${question.substring(0, 40)}..."`);
//             console.log(`  └─ Latency: ${latency}ms | Results: ${filtered.length}`);
//         }

//         // Summary
//         const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
//         const sortedLatencies = [...latencies].sort((a, b) => a - b);
//         const p50 = sortedLatencies[Math.floor(latencies.length * 0.5)];
//         const p95 = sortedLatencies[Math.floor(latencies.length * 0.95)];

//         console.log('\n========== 📈 SUMMARY ==========');
//         console.log(`Average Latency: ${avgLatency}ms`);
//         console.log(`P50 Latency: ${p50}ms`);
//         console.log(`P95 Latency: ${p95}ms`);
//         console.log('=================================\n');

//         return { avgLatency, p50, p95 };
//     }
// });
"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

// Ablation Study - KHÔNG CẦN LLM JUDGE
export const runAblationStudy = action({
    args: {
        fileId: v.string(),
        chunkSize: v.number()
    },
    handler: async (ctx, args) => {
        const k = args.chunkSize;

        // Test questions VỚI KEYWORDS mong đợi
        const testCases = [
            {
                question: "What is the main topic?",
                keywords: ["topic", "about", "study", "research", "thesis", "document"]
            },
            {
                question: "What methodology is used?",
                keywords: ["method", "approach", "technique", "process", "framework"]
            },
            {
                question: "What are the conclusions?",
                keywords: ["conclusion", "result", "finding", "outcome", "summary"]
            },
            {
                question: "Who is the author?",
                keywords: ["author", "by", "written", "student", "researcher"]
            }
        ];

        console.log(`\n========== 🧪 Testing Top-${k} Chunks ==========`);
        console.log(`FileId: ${args.fileId}`);

        const vectorStore = new ConvexVectorStore(
            new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GEMINI_API_KEY,
                model: "text-embedding-004",
                taskType: TaskType.RETRIEVAL_QUERY,
            }),
            { ctx }
        );

        let totalLatency = 0;
        let totalRecall = 0;
        let totalChunksFound = 0;

        for (const testCase of testCases) {
            const start = Date.now();

            // Retrieval
            const searchResults = await vectorStore.similaritySearch(testCase.question, k);
            const filtered = searchResults.filter(r => r.metadata.fileId === args.fileId);

            const latency = Date.now() - start;
            totalLatency += latency;
            totalChunksFound += filtered.length;

            // Keyword Matching - Đếm keywords tìm thấy trong context
            const context = filtered.map(r => r.pageContent).join(' ').toLowerCase();
            const foundKeywords = testCase.keywords.filter(kw => context.includes(kw.toLowerCase()));
            const recall = foundKeywords.length / testCase.keywords.length;
            totalRecall += recall;

            const emoji = recall >= 0.5 ? '✅' : recall > 0 ? '⚠️' : '❌';
            console.log(`  ${emoji} "${testCase.question}" → ${(recall * 100).toFixed(0)}% (${foundKeywords.length}/${testCase.keywords.length} keywords) | ${latency}ms`);
        }

        // Results
        const avgRecall = Math.round((totalRecall / testCases.length) * 100);
        const avgLatency = Math.round(totalLatency / testCases.length);
        const avgChunks = Math.round(totalChunksFound / testCases.length);

        console.log(`\n╔════════════════════════════════════╗`);
        console.log(`║  📊 Top-${k} Chunks Results`.padEnd(38) + '║');
        console.log(`╠════════════════════════════════════╣`);
        console.log(`║  Recall@K:     ${avgRecall}%`.padEnd(38) + '║');
        console.log(`║  Avg Latency:  ${avgLatency}ms`.padEnd(38) + '║');
        console.log(`║  Avg Chunks:   ${avgChunks}`.padEnd(38) + '║');
        console.log(`╚════════════════════════════════════╝\n`);

        return {
            chunkSize: k,
            avgRecall: avgRecall + '%',
            avgLatency,
            avgChunksRetrieved: avgChunks
        };
    }
});