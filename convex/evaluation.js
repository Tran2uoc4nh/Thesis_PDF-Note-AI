"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType, GoogleGenerativeAI } from "@google/generative-ai";

// ==================== TEST DATA: 10 Q&A PAIRS ====================
const TEST_QA_PAIRS_1 = [
    {
        id: 1,
        category: "Methodology",
        question: "What is the primary approach used to develop the movie recommendation system in this study?",
        expectedAnswer: "The system is developed based on the Content-Based Filtering approach, utilizing natural language processing (NLP) techniques and machine learning methods.",
        citation: "Abstract"
    },
    {
        id: 2,
        category: "Dataset",
        question: "Which dataset served as the primary source for this project and how was it structured?",
        expectedAnswer: "The TMDB 5000 Movie Dataset was used as the primary source, consisting of two datasets: 'movies' and 'credits', which were merged on the common column 'title'.",
        citation: "Section 2.1"
    },
    {
        id: 3,
        category: "Preprocessing",
        question: "What specific text preprocessing techniques were applied to standardize the data before vectorization?",
        expectedAnswer: "Text preprocessing techniques such as tokenization, stemming, and lemmatization were applied to standardize the data.",
        citation: "Abstract"
    },
    {
        id: 4,
        category: "Feature Engineering",
        question: "Which textual fields were consolidated to create the input for the vectorization process?",
        expectedAnswer: "The fields genres, keywords, and cast (top 3 actors) were concatenated with the movie overview to create a single textual field.",
        citation: "Section 2.1.3"
    },
    {
        id: 5,
        category: "Vectorization",
        question: "Which method was used to convert the consolidated textual metadata into numerical vectors?",
        expectedAnswer: "The Term Frequency-Inverse Document Frequency (TF-IDF) method was used to capture word importance while reducing the influence of common terms.",
        citation: "Section 2.1.4"
    },
    {
        id: 6,
        category: "Algorithm",
        question: "How does the system calculate the ranking of similar movies?",
        expectedAnswer: "Cosine Similarity is employed to measure the similarity between the TF-IDF vectors of the movies.",
        citation: "Abstract"
    },
    {
        id: 7,
        category: "System Architecture",
        question: "What technology was used to build the interactive user interface (GUI) of the system?",
        expectedAnswer: "The interface was built using Streamlit, allowing users to select a movie and receive recommendations in a grid format.",
        citation: "Section 3.1"
    },
    {
        id: 8,
        category: "Integration",
        question: "What is the function of the TMDB API integration in the final application?",
        expectedAnswer: "The TMDB API is used to fetch and display accurate and high-quality poster images for each recommended movie.",
        citation: "Section 3.1"
    },
    {
        id: 9,
        category: "Results",
        question: "How many movie recommendations does the system provide to the user upon selection?",
        expectedAnswer: "The system identifies and presents the top 10 most similar movies based on the analysis of features.",
        citation: "Abstract & Section 3.1"
    },
    {
        id: 10,
        category: "Future Work",
        question: "What specific Deep Learning techniques are proposed to enhance the system in the future?",
        expectedAnswer: "The study proposes exploring deep learning techniques such as Autoencoders or Neural Collaborative Filtering to improve recommendation quality.",
        citation: "Abstract & Section 3.2"
    }
];

const TEST_QA_PAIRS_2 = [
    {
        id: 1,
        category: "Project Overview",
        question: "What is the primary objective of the Music Recommendation System presented in this report?",
        expectedAnswer: "The system aims to allow users to discover music that matches their preferences or interests based on the song name, utilizing advanced data processing and natural language processing methods.",
        citation: "Overview (Page 1)"
    },
    {
        id: 2,
        category: "Dataset",
        question: "Which dataset was used as the primary source for this project and what are its key features?",
        expectedAnswer: "The Spotify Million Song Dataset from Kaggle was used. It contains 57,650 rows and 4 columns: songs, artist names, links to songs, and lyrics (text).",
        citation: "Section III.1 & III.2 (Page 3-4)"
    },
    {
        id: 3,
        category: "Data Preprocessing",
        question: "How does the system handle duplicate entries during the data preprocessing stage?",
        expectedAnswer: "The system removes duplicates by collecting both the artist's name and the song title to ensure that songs with the same title but by different artists are not accidentally removed.",
        citation: "Section III.3 (Page 4)"
    },
    {
        id: 4,
        category: "Feature Extraction",
        question: "What technique is used to convert text descriptions (lyrics) into numerical representations?",
        expectedAnswer: "The Term Frequency-Inverse Document Frequency (TF-IDF) technique is used to capture the significance of words within a song's metadata while minimizing the impact of frequent but less informative terms.",
        citation: "Section III.3 - Feature Extraction"
    },
    {
        id: 5,
        category: "Algorithm",
        question: "Which metric is employed to calculate the similarity between individual songs?",
        expectedAnswer: "Cosine Similarity is used to measure the similarity between the vectors of the songs based on their preprocessed descriptions and feature representations.",
        citation: "Section III.4 (Page 7)"
    },
    {
        id: 6,
        category: "Implementation",
        question: "What specific library functions are used to implement the recommendation logic?",
        expectedAnswer: "The system uses the `cosine_similarity()` function from `scikit-learn` to compute the similarity matrix between songs.",
        citation: "Section III.4 (Page 7)"
    },
    {
        id: 7,
        category: "User Interface",
        question: "Which framework was selected to build the Graphical User Interface (GUI) for this project?",
        expectedAnswer: "Streamlit, an open-source Python library, was used to build the interactive web-based interface for the recommendation system.",
        citation: "Section III.5 (Page 9)"
    },
    {
        id: 8,
        category: "External Integration",
        question: "What is the role of the Spotify API in the system's architecture?",
        expectedAnswer: "The Spotify API is integrated to retrieve and display the album cover image for each recommended song, enhancing the visual experience.",
        citation: "Section III.5 (Page 9)"
    },
    {
        id: 9,
        category: "Results",
        question: "How many recommendations does the system display to the user after selecting a song?",
        expectedAnswer: "The system identifies and displays the top 5 most similar songs from the dataset alongside their album cover images.",
        citation: "Section IV.1 (Page 11)"
    },
    {
        id: 10,
        category: "Future Work",
        question: "What advanced techniques are proposed to improve the recommendation quality in future iterations?",
        expectedAnswer: "The report proposes incorporating deep learning techniques like collaborative filtering or neural networks to improve recommendation quality.",
        citation: "Section IV.2 (Page 12)"
    }
]

const TEST_QA_PAIRS = [
    {
        id: 1,
        category: "Core Concepts",
        question: "What are the three fundamental principles of sustainability that nature follows?",
        expectedAnswer: "The three principles are: 1. Dependence on solar energy, 2. Biodiversity (providing natural services), and 3. Chemical/nutrient cycling (ensuring little waste in nature).",
        citation: "Section 1-1"
    },
    {
        id: 2,
        category: "Definitions",
        question: "How does the text distinguish between 'Environmental Science' and 'Environmentalism'?",
        expectedAnswer: "Environmental Science is the study of connections in nature and how the earth works, whereas Environmentalism is a social movement dedicated to protecting life support systems for all species.",
        citation: "Section 1-1"
    },
    {
        id: 3,
        category: "Natural Capital",
        question: "According to the equation presented in the chapter, what constitutes 'Natural Capital'?",
        expectedAnswer: "Natural Capital is defined as the sum of Natural Resources and Natural Services (Natural Capital = Natural Resources + Natural Services).",
        citation: "Section 1-1 & Fig 1-3"
    },
    {
        id: 4,
        category: "Resources",
        question: "What are the three categories of nonrenewable resources mentioned with examples?",
        expectedAnswer: "The categories are: Exhaustible energy (e.g., coal and oil), Metallic minerals (e.g., copper and aluminum), and Nonmetallic minerals (e.g., salt and sand).",
        citation: "Section 1-1"
    },
    {
        id: 5,
        category: "Sustainability Solutions",
        question: "What are the suggested sustainable solutions for managing nonrenewable resources?",
        expectedAnswer: "The text suggests the '3Rs' strategy: Reduce, Reuse, and Recycle.",
        citation: "Section 1-1"
    },
    {
        id: 6,
        category: "Ecological Metrics",
        question: "What is the definition of an 'Ecological Footprint'?",
        expectedAnswer: "An Ecological Footprint is the amount of biologically productive land and water needed to supply a person or country with renewable resources and to recycle the waste and pollution produced by such resource use.",
        citation: "Section 1-2"
    },
    {
        id: 7,
        category: "Ecological Metrics",
        question: "When does an 'Ecological Deficit' occur?",
        expectedAnswer: "An Ecological Deficit occurs when the ecological footprint of a population is larger than the biological capacity of the area to replenish its resources and absorb wastes.",
        citation: "Section 1-2"
    },
    {
        id: 8,
        category: "Visual/Diagram",
        question: "Based on the 'Natural Capital' diagram (Fig 1-3), list three examples of 'Natural Services'.",
        expectedAnswer: "Examples of Natural Services include Air purification, Climate control, UV protection (ozone layer), Water purification, Waste treatment, and Soil renewal.",
        citation: "Fig 1-3 (Section 1-1)"
    },
    {
        id: 9,
        category: "Environmental Degradation",
        question: "What are some specific examples of 'Natural Capital Degradation' listed in the text?",
        expectedAnswer: "Examples include climate change, shrinking forests, air pollution, species extinction, soil erosion, water pollution, and aquifer depletion.",
        citation: "Fig 1-5 (Section 1-2)"
    },
    {
        id: 10,
        category: "Worldviews",
        question: "How does the 'Planetary Management Worldview' differ from the 'Environmental Wisdom Worldview'?",
        expectedAnswer: "The Planetary Management Worldview holds that we are separate from and in charge of nature, while the Environmental Wisdom Worldview holds that we are part of and dependent on nature, and that nature exists for all species, not just humans.",
        citation: "Section 1-3 (Page 28)"
    }
]


// ==================== UTILITY FUNCTIONS ====================

// Tokenize text into words (lowercase, remove punctuation)
function tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0);
}

// Calculate F1 Score between predicted and expected answer
function calculateF1Score(predicted, expected) {
    const predTokens = new Set(tokenize(predicted));
    const expTokens = new Set(tokenize(expected));

    if (predTokens.size === 0 || expTokens.size === 0) return 0;

    // Calculate overlap
    let overlap = 0;
    for (const token of predTokens) {
        if (expTokens.has(token)) overlap++;
    }

    const precision = overlap / predTokens.size;
    const recall = overlap / expTokens.size;

    if (precision + recall === 0) return 0;

    const f1 = (2 * precision * recall) / (precision + recall);
    return f1;
}

// Calculate ROUGE-L (Longest Common Subsequence)
function calculateRougeL(predicted, expected) {
    const predTokens = tokenize(predicted);
    const expTokens = tokenize(expected);

    if (predTokens.length === 0 || expTokens.length === 0) return 0;

    // LCS using dynamic programming
    const m = predTokens.length;
    const n = expTokens.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (predTokens[i - 1] === expTokens[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const lcs = dp[m][n];
    const precision = lcs / m;
    const recall = lcs / n;

    if (precision + recall === 0) return 0;

    const fScore = (2 * precision * recall) / (precision + recall);
    return fScore;
}

// Check for key information extraction (keyword matching)
function checkKeywordMatch(predicted, expected) {
    // Extract key terms from expected answer
    const keywords = tokenize(expected).filter(word =>
        word.length > 3 &&
        !['the', 'and', 'for', 'that', 'with', 'was', 'were', 'this', 'from', 'used', 'based'].includes(word)
    );

    const predLower = predicted.toLowerCase();
    let matchedCount = 0;
    const matchedKeywords = [];

    for (const keyword of keywords) {
        if (predLower.includes(keyword)) {
            matchedCount++;
            matchedKeywords.push(keyword);
        }
    }

    return {
        total: keywords.length,
        matched: matchedCount,
        ratio: keywords.length > 0 ? matchedCount / keywords.length : 0,
        keywords: matchedKeywords
    };
}

// Detect hallucination indicators
function detectHallucination(predicted, context) {
    const indicators = {
        hasRefusal: false,
        mentionsUncertainty: false,
        outsideContext: false,
        score: 0 // 0 = no hallucination, 1 = definite hallucination
    };

    const predLower = predicted.toLowerCase();

    // Check for admission of no information
    const refusalPhrases = [
        "cannot find information",
        "no information",
        "not found in",
        "don't have information",
        "unable to find",
        "not mentioned in"
    ];

    for (const phrase of refusalPhrases) {
        if (predLower.includes(phrase)) {
            indicators.hasRefusal = true;
            break;
        }
    }

    // Check for uncertainty phrases
    const uncertaintyPhrases = [
        "might be", "may be", "possibly", "perhaps",
        "i think", "it seems", "appears to be", "likely"
    ];

    for (const phrase of uncertaintyPhrases) {
        if (predLower.includes(phrase)) {
            indicators.mentionsUncertainty = true;
            break;
        }
    }

    return indicators;
}

// ==================== MAIN EVALUATION FUNCTION ====================
export const runHallucinationEvaluation = action({
    args: {
        fileId: v.string(),
    },
    handler: async (ctx, args) => {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 HALLUCINATION EVALUATION - Starting...');
        console.log('='.repeat(60));
        console.log(`📄 FileId: ${args.fileId}`);
        console.log(`📊 Test Cases: ${TEST_QA_PAIRS.length}`);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const vectorStore = new ConvexVectorStore(
            new GoogleGenerativeAIEmbeddings({
                apiKey: process.env.GEMINI_API_KEY,
                model: "text-embedding-004",
                taskType: TaskType.RETRIEVAL_QUERY,
            }),
            { ctx }
        );

        const results = [];
        let totalF1 = 0;
        let totalRougeL = 0;
        let totalKeywordMatch = 0;
        let correctAnswers = 0;
        let hallucinatedAnswers = 0;

        for (const testCase of TEST_QA_PAIRS) {
            console.log(`\n--- Test ${testCase.id}: ${testCase.category} ---`);
            console.log(`Q: "${testCase.question.substring(0, 60)}..."`);

            const startTime = Date.now();

            try {
                // 1. Retrieve context from Vector DB
                const searchResults = await vectorStore.similaritySearch(testCase.question, 15);
                const filtered = searchResults.filter(r => r.metadata.fileId === args.fileId);

                const context = filtered.map(r => r.pageContent).join('\n\n');

                // 2. Generate answer using Gemini (same prompt as EditorExtension)
                const prompt = `You are a strict AI assistant for PDF question-answering.
                CONTEXT FROM DOCUMENT:
                ${context || "[NO RELEVANT CONTEXT FOUND]"}

                STRICT RULES:
                1. If context is empty or says "[NO RELEVANT CONTEXT FOUND]", respond: "I cannot find information about this in the provided document."
                2. NEVER use your pre-trained knowledge.
                3. ONLY use information from the context above.
                4. Answer concisely and factually.

                Question: "${testCase.question}"
                
                Answer:`;

                const result = await model.generateContent(prompt);
                const generatedAnswer = result.response.text().trim();

                const latency = Date.now() - startTime;

                // 3. Calculate metrics
                const f1Score = calculateF1Score(generatedAnswer, testCase.expectedAnswer);
                const rougeL = calculateRougeL(generatedAnswer, testCase.expectedAnswer);
                const keywordMatch = checkKeywordMatch(generatedAnswer, testCase.expectedAnswer);
                const hallucination = detectHallucination(generatedAnswer, context);

                // 4. Semantic similarity using embeddings
                const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

                let semanticSimilarity = 0;
                try {
                    const [genEmb, expEmb] = await Promise.all([
                        embeddingModel.embedContent(generatedAnswer),
                        embeddingModel.embedContent(testCase.expectedAnswer)
                    ]);

                    const genVec = genEmb.embedding.values;
                    const expVec = expEmb.embedding.values;

                    // Cosine similarity
                    let dotProduct = 0;
                    let normGen = 0;
                    let normExp = 0;

                    for (let i = 0; i < genVec.length; i++) {
                        dotProduct += genVec[i] * expVec[i];
                        normGen += genVec[i] * genVec[i];
                        normExp += expVec[i] * expVec[i];
                    }

                    semanticSimilarity = dotProduct / (Math.sqrt(normGen) * Math.sqrt(normExp));
                } catch (e) {
                    console.log('  ⚠️ Embedding error, skipping semantic similarity');
                }

                // 5. Determine if answer is correct (threshold: semantic > 0.7 OR F1 > 0.5)
                const isCorrect = semanticSimilarity > 0.7 || f1Score > 0.5;
                const isHallucinated = !isCorrect && !hallucination.hasRefusal && context.length > 0;

                if (isCorrect) correctAnswers++;
                if (isHallucinated) hallucinatedAnswers++;

                // Update totals
                totalF1 += f1Score;
                totalRougeL += rougeL;
                totalKeywordMatch += keywordMatch.ratio;

                // Log result
                const statusEmoji = isCorrect ? '✅' : (isHallucinated ? '❌' : '⚠️');
                console.log(`  ${statusEmoji} F1: ${(f1Score * 100).toFixed(1)}% | ROUGE-L: ${(rougeL * 100).toFixed(1)}% | Semantic: ${(semanticSimilarity * 100).toFixed(1)}%`);
                console.log(`  🔑 Keywords: ${keywordMatch.matched}/${keywordMatch.total} (${(keywordMatch.ratio * 100).toFixed(0)}%)`);
                console.log(`  ⏱️ Latency: ${latency}ms | Chunks: ${filtered.length}`);

                results.push({
                    id: testCase.id,
                    category: testCase.category,
                    question: testCase.question,
                    expectedAnswer: testCase.expectedAnswer,
                    generatedAnswer: generatedAnswer.substring(0, 500),
                    metrics: {
                        f1Score: Math.round(f1Score * 100),
                        rougeL: Math.round(rougeL * 100),
                        semanticSimilarity: Math.round(semanticSimilarity * 100),
                        keywordMatchRatio: Math.round(keywordMatch.ratio * 100)
                    },
                    isCorrect,
                    isHallucinated,
                    latencyMs: latency,
                    chunksRetrieved: filtered.length
                });

                // Rate limit
                await new Promise(r => setTimeout(r, 1000));

            } catch (error) {
                console.error(`  ❌ Error: ${error.message}`);
                results.push({
                    id: testCase.id,
                    category: testCase.category,
                    error: error.message
                });
            }
        }

        // ==================== SUMMARY ====================
        const totalTests = TEST_QA_PAIRS.length;
        const avgF1 = (totalF1 / totalTests * 100).toFixed(1);
        const avgRougeL = (totalRougeL / totalTests * 100).toFixed(1);
        const avgKeywordMatch = (totalKeywordMatch / totalTests * 100).toFixed(1);
        const accuracy = (correctAnswers / totalTests * 100).toFixed(1);
        const hallucinationRate = (hallucinatedAnswers / totalTests * 100).toFixed(1);


        return {
            summary: {
                totalTests,
                correctAnswers,
                hallucinatedAnswers,
                accuracy: `${accuracy}%`,
                hallucinationRate: `${hallucinationRate}%`,
                avgF1Score: `${avgF1}%`,
                avgRougeL: `${avgRougeL}%`,
                avgKeywordMatch: `${avgKeywordMatch}%`
            },
            results
        };
    }
});


// ==================== LLM-AS-JUDGE EVALUATION ====================
// // Sử dụng Gemini làm "Judge" để đánh giá semantic accuracy
// export const runLLMJudgeEvaluation = action({
//     args: {
//         fileId: v.string(),
//     },
//     handler: async (ctx, args) => {
//         console.log('\n' + '='.repeat(60));
//         console.log('⚖️ LLM-AS-JUDGE EVALUATION - Starting...');
//         console.log('='.repeat(60));

//         const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//         const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//         const vectorStore = new ConvexVectorStore(
//             new GoogleGenerativeAIEmbeddings({
//                 apiKey: process.env.GEMINI_API_KEY,
//                 model: "text-embedding-004",
//                 taskType: TaskType.RETRIEVAL_QUERY,
//             }),
//             { ctx }
//         );

//         const results = [];
//         let totalScore = 0;

//         for (const testCase of TEST_QA_PAIRS) {
//             console.log(`\n--- Test ${testCase.id}: ${testCase.category} ---`);

//             try {
//                 // 1. Get context and generate answer
//                 const searchResults = await vectorStore.similaritySearch(testCase.question, 15);
//                 const filtered = searchResults.filter(r => r.metadata.fileId === args.fileId);
//                 const context = filtered.map(r => r.pageContent).join('\n\n');

//                 const answerPrompt = `You are a strict AI assistant for PDF question-answering.
//                 CONTEXT: ${context || "[NO RELEVANT CONTEXT FOUND]"}

//                 RULES: Only use information from the context. If not found, say "I cannot find information about this in the provided document."

//                 Question: "${testCase.question}"
//                 Answer:`;

//                 const answerResult = await model.generateContent(answerPrompt);
//                 const generatedAnswer = answerResult.response.text().trim();

//                 // 2. Use LLM as Judge
//                 const judgePrompt = `You are an expert evaluator. Compare the GENERATED answer against the EXPECTED answer.

// QUESTION: "${testCase.question}"

// EXPECTED ANSWER: "${testCase.expectedAnswer}"

// GENERATED ANSWER: "${generatedAnswer}"

// Evaluate on these criteria:
// 1. FACTUAL ACCURACY (0-3): Does generated answer contain the same facts as expected?
// 2. COMPLETENESS (0-3): Does it cover all key points?
// 3. HALLUCINATION (0-3): Does it add false information not in context? (3 = no hallucination, 0 = severe hallucination)
// 4. RELEVANCE (0-1): Is it answering the right question?

// Return ONLY a JSON object:
// {
//     "factualAccuracy": <0-3>,
//     "completeness": <0-3>,
//     "hallucination": <0-3>,
//     "relevance": <0-1>,
//     "totalScore": <sum out of 10>,
//     "verdict": "CORRECT" | "PARTIAL" | "HALLUCINATED" | "WRONG",
//     "explanation": "Brief explanation"
// }`;

//                 const judgeResult = await model.generateContent(judgePrompt);
//                 let judgeResponse = judgeResult.response.text().trim();

//                 // Parse JSON
//                 judgeResponse = judgeResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
//                 const evaluation = JSON.parse(judgeResponse);

//                 totalScore += evaluation.totalScore || 0;

//                 const emoji = evaluation.verdict === 'CORRECT' ? '✅' :
//                     evaluation.verdict === 'PARTIAL' ? '⚠️' : '❌';

//                 console.log(`  ${emoji} Score: ${evaluation.totalScore}/10 | Verdict: ${evaluation.verdict}`);
//                 console.log(`  📝 ${evaluation.explanation}`);

//                 results.push({
//                     id: testCase.id,
//                     category: testCase.category,
//                     question: testCase.question,
//                     expectedAnswer: testCase.expectedAnswer,
//                     generatedAnswer: generatedAnswer.substring(0, 300),
//                     evaluation
//                 });

//                 await new Promise(r => setTimeout(r, 1500));

//             } catch (error) {
//                 console.error(`  ❌ Error: ${error.message}`);
//                 results.push({ id: testCase.id, error: error.message });
//             }
//         }

//         // Summary
//         const avgScore = (totalScore / TEST_QA_PAIRS.length).toFixed(2);
//         const correctCount = results.filter(r => r.evaluation?.verdict === 'CORRECT').length;
//         const hallucinatedCount = results.filter(r => r.evaluation?.verdict === 'HALLUCINATED').length;

//         console.log('\n' + '='.repeat(60));
//         console.log('📊 LLM-AS-JUDGE SUMMARY');
//         console.log('='.repeat(60));
//         console.log(`┌─────────────────────────────────────────┐`);
//         console.log(`│  Total Tests:        ${TEST_QA_PAIRS.length.toString().padStart(3)}               │`);
//         console.log(`│  CORRECT:            ${correctCount.toString().padStart(3)}               │`);
//         console.log(`│  HALLUCINATED:       ${hallucinatedCount.toString().padStart(3)}               │`);
//         console.log(`│  Avg Score:          ${avgScore}/10           │`);
//         console.log(`│  Accuracy:           ${((correctCount / TEST_QA_PAIRS.length) * 100).toFixed(1)}%             │`);
//         console.log(`└─────────────────────────────────────────┘`);

//         return {
//             summary: {
//                 totalTests: TEST_QA_PAIRS.length,
//                 correctCount,
//                 hallucinatedCount,
//                 avgScore: `${avgScore}/10`,
//                 accuracy: `${((correctCount / TEST_QA_PAIRS.length) * 100).toFixed(1)}%`
//             },
//             results
//         };
//     }
// });


// ==================== ABLATION STUDY (GIỮU LẠI TỪ FILE CŨ) ====================
export const runAblationStudy = action({
    args: {
        fileId: v.string(),
        chunkSize: v.number()
    },
    handler: async (ctx, args) => {
        const k = args.chunkSize;

        const testCases = [
            { question: "What is the main topic?", keywords: ["topic", "about", "study", "research", "thesis", "document"] },
            { question: "What methodology is used?", keywords: ["method", "approach", "technique", "process", "framework"] },
            { question: "What are the conclusions?", keywords: ["conclusion", "result", "finding", "outcome", "summary"] },
            { question: "Who is the author?", keywords: ["author", "by", "written", "student", "researcher"] }
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
            const searchResults = await vectorStore.similaritySearch(testCase.question, k);
            const filtered = searchResults.filter(r => r.metadata.fileId === args.fileId);
            const latency = Date.now() - start;

            totalLatency += latency;
            totalChunksFound += filtered.length;

            const context = filtered.map(r => r.pageContent).join(' ').toLowerCase();
            const foundKeywords = testCase.keywords.filter(kw => context.includes(kw.toLowerCase()));
            const recall = foundKeywords.length / testCase.keywords.length;
            totalRecall += recall;

            const emoji = recall >= 0.5 ? '✅' : recall > 0 ? '⚠️' : '❌';
            console.log(`  ${emoji} "${testCase.question}" → ${(recall * 100).toFixed(0)}% (${foundKeywords.length}/${testCase.keywords.length} keywords) | ${latency}ms`);
        }

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