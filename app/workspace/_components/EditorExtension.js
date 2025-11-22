'use client'
import React, { useState, useEffect, useContext } from 'react'
import { BoldIcon, ItalicIcon, UnderlineIcon, Heading1Icon, Heading2Icon, Heading3Icon, StrikethroughIcon, ListIcon, TextQuoteIcon, HighlighterIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, DownloadIcon, ImageIcon } from 'lucide-react'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { FileSaveContext } from '@/app/_context/FileSaveContext'
import htmlDocx from 'html-docx-js/dist/html-docx';
import { saveAs } from 'file-saver';
import { chatSession } from '@/configs/AIModel'
import Image from 'next/image'
import { SparklesIcon } from 'lucide-react'



const EditorExtension = ({ editor }) => {
    const [isBold, setIsBold] = useState(false)
    const [isItalic, setIsItalic] = useState(false)
    const [isUnderline, setIsUnderline] = useState(false)
    const [isStrike, setIsStrike] = useState(false)
    const [isH1, setIsH1] = useState(false)
    const [isH2, setIsH2] = useState(false)
    const [isH3, setIsH3] = useState(false)
    const [isBulletList, setIsBulletList] = useState(false)
    const [isBlockquote, setIsBlockquote] = useState(false)
    const [isHighlight, setIsHighlight] = useState(false)
    const [showHighlightDropdown, setShowHighlightDropdown] = useState(false)
    const [isAlignLeft, setIsAlignLeft] = useState(false)
    const [isAlignCenter, setIsAlignCenter] = useState(false)
    const [isAlignRight, setIsAlignRight] = useState(false)
    const [isImageSelected, setIsImageSelected] = useState(false)
    const [imageAlignLeft, setImageAlignLeft] = useState(false)
    const [imageAlignCenter, setImageAlignCenter] = useState(false)
    const [imageAlignRight, setImageAlignRight] = useState(false)
    const [isProcessingImage, setIsProcessingImage] = useState(false)
    useEffect(() => {
        if (!editor) return

        // Update state khi editor update
        const updateState = () => {
            setIsBold(editor.isActive('bold'))
            setIsItalic(editor.isActive('italic'))
            setIsUnderline(editor.isActive('underline'))
            setIsStrike(editor.isActive('strike'))
            setIsH1(editor.isActive('heading', { level: 1 }))
            setIsH2(editor.isActive('heading', { level: 2 }))
            setIsH3(editor.isActive('heading', { level: 3 }))
            setIsBulletList(editor.isActive('bulletList'))
            setIsBlockquote(editor.isActive('blockquote'))
            setIsHighlight(editor.isActive('highlight'))
            setIsAlignLeft(editor.isActive({ textAlign: 'left' }))
            setIsAlignCenter(editor.isActive({ textAlign: 'center' }))
            setIsAlignRight(editor.isActive({ textAlign: 'right' }))


            const imageActive = editor.isActive('image')
            setIsImageSelected(imageActive)

            if (imageActive) {
                const attrs = editor.getAttributes('image')
                const align = attrs.align || 'center'
                setImageAlignLeft(align === 'left')
                setImageAlignCenter(align === 'center')
                setImageAlignRight(align === 'right')
            } else {
                setImageAlignLeft(false)
                setImageAlignCenter(false)
                setImageAlignRight(false)
            }
        }

        // Lắng nghe editor updates
        editor.on('update', updateState)
        editor.on('selectionUpdate', updateState)

        // Cleanup
        return () => {
            editor.off('update', updateState)
            editor.off('selectionUpdate', updateState)
        }
    }, [editor])


    //
    const { fileId } = useParams()
    const SearchAI = useAction(api.myAction.search)
    const addNotes = useMutation(api.notes.AddNotes)
    const { user } = useUser()
    const { fileSave, setFileSave } = useContext(FileSaveContext);
    const searchImageInPdf = useAction(api.myAction.searchImageInPdf)


    // // Lưu History
    // const [conversationHistory, setConversationHistory] = useState([]);


    const onImageSearchClick = async () => {
        // if (!isImageSelected) {
        //     toast.error('Vui lòng chọn một hình ảnh trước!')
        //     return
        // }

        try {
            setIsProcessingImage(true)
            toast('AI is analyzing the image...')

            // Get image data from editor
            const { view, state } = editor
            const { from } = state.selection
            const node = state.doc.nodeAt(from)

            if (!node || node.type.name !== 'image') {
                toast.error('The selected image was not found')
                return
            }

            // Get image src (base64 or URL)
            const imageSrc = node.attrs.src

            // Convert to base64 if needed
            let imageBase64 = imageSrc
            if (imageSrc.startsWith('http')) {
                // Fetch and convert to base64
                const response = await fetch(imageSrc)
                const blob = await response.blob()
                imageBase64 = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        // Remove data:image/xxx;base64, prefix
                        const base64 = reader.result.split(',')[1]
                        resolve(base64)
                    }
                    reader.readAsDataURL(blob)
                })
            } else if (imageSrc.startsWith('data:')) {
                // Remove prefix
                imageBase64 = imageSrc.split(',')[1]
            }

            // Search in PDF
            const result = await searchImageInPdf({
                imageBase64: imageBase64,
                fileId: fileId
            })

            console.log('Search result:', result)

            // Format response
            let responseHtml = `<div style="background: #f0f9ff">
                <p><strong>Description:</strong> ${result.description}</p>
            `

            if (result.matches && result.matches.length > 0) {


                responseHtml += `<p><strong style="color: #15803d;">It's in this PDF ! Here are (some)results you can reference:</strong></p>
                <ul>`

                const cleanDescription = (desc) => {
                    // Loại bỏ phần [image - Page X] hoặc [Visual element - Page X] ở đầu
                    return desc.replace(/^\[.*?\s*-\s*(Page|Trang)\s*\d+\]\s*/i, '').trim();
                };

                if (result.matches.length >= 3) {
                    const top3Matches = result.matches.slice(0, 3);
                    top3Matches.forEach((match, index) => {
                        responseHtml += `
                        <li style="margin-bottom: 8px;">
                            <strong>Page ${match.page}</strong> - ${match.type || 'image'}
                            <br/>
                            <span style="color: #475569;">${cleanDescription(match.description)}</span>
                        </li>`
                    })
                } else {
                    result.matches.forEach((match, index) => {
                        responseHtml += `
                        <li style="margin-bottom: 8px;">
                            <strong>Page ${match.page}</strong> - ${match.type || 'image'}
                            <br/>
                            <span style="color: #475569;">${cleanDescription(match.description)}</span>
                        </li>`
                    })
                }

                responseHtml += `</ul>`
            } else {
                responseHtml += `<p><strong style="color: #dc2626;">❌ It seems this image is not in this PDF.</strong></p>
                `
            }

            responseHtml += `</div>`

            // Insert result into editor
            const currentContent = editor.getHTML()
            editor.commands.setContent(currentContent + responseHtml)

            // Save to database
            addNotes({
                notes: editor.getHTML(),
                fileId: fileId,
                createdBy: user?.primaryEmailAddress?.emailAddress
            })

            toast.success('✅ Hoàn tất!')

        } catch (error) {
            console.error('Image search error:', error)
            toast.error('Có lỗi xảy ra: ' + error.message)
        } finally {
            setIsProcessingImage(false)
        }
    }


    const onAiClick = async () => {
        toast('AI is thinking...')
        const selectedText = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            ''
        )
        const result = await SearchAI({
            query: selectedText,
            fileId: fileId
        })

        const UnformattedAns = JSON.parse(result)


        let formattedContext = '';
        let validChunkCount = 0;

        // Này là check ans tồn tại không thì mới chạy ans
        UnformattedAns && UnformattedAns.forEach((item, index) => {
            console.log("Item:", item);

            const content = item.pageContent || '';

            validChunkCount++;
            const page = item.metadata?.page || '?';
            const chunkId = item.metadata?.chunk_id || index;
            const header = `[C${validChunkCount}] (page ${page}, chunk ${chunkId})`;

            formattedContext += `${header}\n${content}\n\n`;
        });

        if (!formattedContext.trim()) {
            formattedContext = "[NO RELEVANT CONTEXT FOUND]";
        }




        // Build conversation history string
        // let historyString = '';
        // if (conversationHistory.length > 0) {
        //     historyString = '\n\nPREVIOUS CONVERSATION:\n';
        //     conversationHistory.forEach((msg, i) => {
        //         if (i % 2 === 0) {
        //             historyString += `User: ${msg}\n`;
        //         } else {
        //             historyString += `Assistant: ${msg}\n\n`;
        //         }
        //     });
        // }
        // Build conversation history from existing notes in editor
        let historyString = '';
        const currentEditorContent = editor.getText(); // Lấy toàn bộ text từ editor (không có HTML tags)

        if (currentEditorContent && currentEditorContent.trim().length > 0) {
            // Chỉ lấy tối đa 3000 ký tự cuối cùng để tránh prompt quá dài
            const recentContent = currentEditorContent.slice(-3000);

            historyString = `\n\nPREVIOUS NOTES AND CONVERSATION:
            ${recentContent}

            NOTE: The above is the user's previous notes and Q&A history in this document.
            Use this context to answer follow-up questions or reference previous answers.
            `;
        }


        // const PROMPT = `You are a strict AI assistant for PDF question-answering.
        // CONTEXT FROM DOCUMENT:
        // ${formattedContext}
        // ${historyString}

        // STRICT RULES - YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
        // 1. READ the context carefully. If the context says "[NO RELEVANT CONTEXT FOUND]" or does not contain information to answer the question, you MUST respond EXACTLY with: "I cannot find information about this in the provided document."
        // 2. NEVER use your pre-trained knowledge or general knowledge to answer.
        // 3. You can reference information from the PREVIOUS CONVERSATION if it's relevant to the current question.
        // 4. ONLY use information from: (a) CONTEXT above, (b) PREVIOUS CONVERSATION
        // 5. If asking about "author", look for fields like "Student name", "By", "Written by"
        // 6. If asking about "advisor", look for "Advisor", "Supervisor"
        // 7. If asking about "topic", look at titles, headings, and introduction
        // 8. CRITICAL LANGUAGE RULE: Answer in the EXACT SAME LANGUAGE as the user's question. 
        //     - If user asks in English → Answer in English
        //     - If user asks in Vietnamese → Answer in Vietnamese
        //     - If user asks in another language → Answer in that language
        //     - DO NOT change language based on context language. The user's question language is the ONLY language you should use.
        // 9. HANDLING COMPREHENSIVE QUESTIONS (like "show me all", "list all", "what are all"):
        // - If the question asks for ALL items (definitions, examples, concepts, etc.), you MUST:
        //     * Search through ALL provided context chunks
        //     * List EVERY relevant item found
        //     * Organize them clearly (numbered list, bullet points, or structured format)
        //     * Include page numbers references when available
        //     * If multiple definitions/concepts are found, list them ALL
        // - Example: If asked "Show me all definitions", find ALL definition-like content in the context and list them all
        // 10. Provide answer in HTML format with <mark> tags to highlight key information.
        // Remember: It is better to say "I don't know" than to provide information not in the document or previous conversation.
        // 11. For comprehensive questions, use structured format like:
        // - <ol> for numbered lists
        // - <ul> for bullet points
        // - <strong> for emphasis
        // - <mark> for key terms
        // Current Question: "${selectedText}"
        // REMEMBER: 
        // - Match the language of the user's question, NOT the language of the context.
        // - If question asks for "all" or "list", provide COMPLETE list from ALL context chunks.

        // Answer:`;

        const PROMPT = `You are a strict AI assistant for PDF question-answering.
                        CONTEXT FROM DOCUMENT:
                        ${formattedContext}
                        ${historyString}

                        STRICT RULES - YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
                        1. READ the context carefully. If the context says "[NO RELEVANT CONTEXT FOUND]" or does not contain information to answer the question, you MUST respond EXACTLY with: "I cannot find information about this in the provided document."
                        2. NEVER use your pre-trained knowledge or general knowledge to answer.
                        3. You can reference information from the PREVIOUS CONVERSATION if it's relevant to the current question.
                        4. ONLY use information from: (a) CONTEXT above, (b) PREVIOUS CONVERSATION
                        5. If asking about "author", look for fields like "Student name", "By", "Written by"
                        6. If asking about "advisor", look for "Advisor", "Supervisor"
                        7. If asking about "topic", look at titles, headings, and introduction
                        8. CRITICAL LANGUAGE RULE: Answer in the EXACT SAME LANGUAGE as the user's question. 
                            - If user asks in English → Answer in English
                            - If user asks in Vietnamese → Answer in Vietnamese
                            - If user asks in another language → Answer in that language
                            - DO NOT change language based on context language. The user's question language is the ONLY language you should use.

                        9. HANDLING COMPREHENSIVE QUESTIONS (like "show me all", "list all", "what are all"):
                        - If the question asks for ALL items (definitions, examples, concepts, etc.), you MUST:
                            * Search through ALL provided context chunks
                            * List EVERY relevant item found
                            * Organize them clearly (numbered list, bullet points, or structured format)
                            * Include page numbers references when available
                            * If multiple definitions/concepts are found, list them ALL
                        - Example: If asked "Show me all definitions", find ALL definition-like content in the context and list them all

                        10. SPECIAL HANDLING FOR DATES, EVENTS, AND TIMELINE QUESTIONS:
                        - If asked to find "dates", "timeline", "events", "milestones", "important dates", "ngày tháng", "sự kiện", "mốc thời gian":
                            * Scan ALL context chunks for date patterns (e.g., "2024", "January 15", "15/01/2024", "tháng 1 năm 2024")
                            * Look for time-related keywords: "date", "when", "year", "month", "day", "period", "during", "ngày", "tháng", "năm", "vào", "trong", "khi"
                            * Extract ALL dates with their associated events/descriptions
                            * Format as timeline or chronological list with page references
                            * Example format:
                            <ul>
                                <li><mark>15/01/2024</mark> (page 5): Bắt đầu dự án</li>
                                <li><mark>Tháng 3 năm 2024</mark> (page 12): Hoàn thành giai đoạn 1</li>
                            </ul>

                        11. SPECIAL HANDLING FOR STATISTICS AND NUMERICAL DATA:
                        - If asked to extract "statistics", "numbers", "data", "figures", "percentages", "số liệu", "thống kê", "dữ liệu số":
                            * Scan ALL context chunks for numerical values, percentages, measurements
                            * Look for patterns: numbers followed by units (%, kg, USD, people, users, etc.)
                            * Group by categories if possible (e.g., financial data, demographic data, performance metrics)
                            * Include context for each statistic (what does the number represent?)
                            * Format clearly with page references
                            * Example format:
                            <ul>
                                <li><strong>Dân số:</strong> <mark>5.2 triệu người</mark> (page 8)</li>
                                <li><strong>Tăng trưởng:</strong> <mark>15.3%</mark> năm 2023 (page 15)</li>
                                <li><strong>Ngân sách:</strong> <mark>$2.5 triệu</mark> (page 22)</li>
                            </ul>

                        12. Provide answer in HTML format with <mark> tags to highlight key information (dates, numbers, names, key terms).

                        13. For comprehensive questions, use structured format like:
                        - <ol> for numbered lists (when order matters)
                        - <ul> for bullet points (for general lists)
                        - <strong> for category headers or emphasis
                        - <mark> for highlighting specific data (dates, numbers, key terms)
                        - <table> for large datasets if appropriate

                        14. ANALYZING USER'S NOTES AND INTERESTS:
                        - If asked to analyze, summarize, or extract insights from user's notes:
                            * Keywords to recognize: "dựa trên ghi chú", "based on my notes", "from my notes", "các điểm tôi quan tâm", "what I'm interested in", "tóm tắt ghi chú"
                            * Analyze the PREVIOUS NOTES AND CONVERSATION section to identify:
                                - Topics the user asked questions about (frequency of questions on specific topics)
                                - Information the user manually noted down (indicates interest)
                                - Key terms or concepts the user highlighted or emphasized
                                - Questions the user asked multiple times or followed up on
                            * Create a structured summary categorizing by themes or topics
                            * Example format for "tóm tắt các điểm tôi quan tâm nhất":
                            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 12px 0;">
                                <h3>Your notes analysis:</h3>
                                <ul>
                                    <li><strong>Topic 1:</strong> [Topic name]
                                        <ul>
                                            <li>You asked about: [specific questions]</li>
                                            <li>Your notes: [user's notes on this topic]</li>
                                            <li>Related to page: [page numbers]</li>
                                        </ul>
                                    </li>
                                    <li><strong>Topic 2:</strong> [Another topic...]</li>
                                </ul>
                            </div>

                        15. COMPARING AND FINDING CONTRADICTIONS BETWEEN NOTES AND PDF:
                        - If asked to find contradictions, differences, or inconsistencies:
                            * Keywords: "mâu thuẫn", "khác biệt", "không khớp", "contradictions", "differences", "inconsistencies", "so sánh", "compare"
                            * Compare statements in PREVIOUS NOTES with information from CONTEXT FROM DOCUMENT
                            * Look for:
                                - Different numbers/statistics on the same topic
                                - Conflicting dates or timelines
                                - Opposite conclusions or interpretations
                                - Missing information that user assumed or noted
                            * Clearly indicate source: [From Notes] vs [From PDF - Page X]
                            * Example format:
                            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 12px 0;">
                                <h3>Compare your notes and PDF:</h3>
                                <ul>
                                    <li><strong>About [Topic]:</strong>
                                        <ul>
                                            <li><strong>In your notes:</strong> [what user noted]</li>
                                            <li><strong>In PDF (page X):</strong> [what PDF says]</li>
                                            <li><strong>Analysis:</strong> [Are they contradictory? Why might this difference exist?]</li>
                                        </ul>
                                    </li>
                                </ul>
                                <p style="color: #92400e; font-size: 14px; margin-top: 12px;">
                                     <em>Note: These differences may be due to [possible reasons: different interpretations, user's own insights, clarifications, etc.]</em>
                                </p>
                            </div>
                        Remember: It is better to say "I don't know" than to provide information not in the document or previous conversation.

                        Current Question: "${selectedText}"

                        REMEMBER: 
                        - Match the language of the user's question, NOT the language of the context.
                        - If question asks for "all", "list", "find all", "extract", provide COMPLETE extraction from ALL context chunks.
                        - For dates/events: Look for ALL time references across all chunks
                        - For statistics: Look for ALL numerical data across all chunks
                        - ALWAYS include page numbers in your citations

                        Answer:`;

        const AiModelResult = await chatSession.sendMessage(PROMPT);
        const response = AiModelResult.response.text();
        const FinalAns = response.replace(/```html/g, '').replace(/```/g, '');

        // 🎬 TYPING ANIMATION
        const AllText = editor.getHTML();
        let currentIndex = 0;
        const typingSpeed = 10; // milliseconds per character (càng nhỏ càng nhanh)

        // Function để type từng ký tự
        const typeWriter = () => {
            if (currentIndex < FinalAns.length) {
                const currentText = FinalAns.substring(0, currentIndex + 1);
                editor.commands.setContent(AllText + '<p><strong>Answer: </strong>' + currentText + '</p>');
                currentIndex++;
                setTimeout(typeWriter, typingSpeed);
            } else {
                // Khi typing xong, save vào database
                addNotes({
                    notes: editor.getHTML(),
                    fileId: fileId,
                    createdBy: user?.primaryEmailAddress?.emailAddress
                })
            }
        };

        // Bắt đầu animation
        typeWriter();




    }


    const download = () => {
        console.log(editor.getHTML())
        const htmlString = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><title>Document</title></head>
          <body>${editor.getHTML()}</body>
          </html>
        `;
        let converted = htmlDocx.asBlob(htmlString);
        console.log(converted)
        saveAs(converted, 'Note-PDF.docx');
    }

    useEffect(() => {
        fileSave && editor && addNotes({
            notes: editor.getHTML(),
            fileId: fileId,
            createdBy: user?.primaryEmailAddress?.emailAddress
        })
        fileSave && editor && toast('File Saved')
    }, [fileSave])



    if (!editor) {
        return null
    }



    return (
        <div className='p-5'>

            <div className="control-group">
                <div className="button-group flex gap-3 flex-wrap">
                    {/* Heading 1 */}
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-1 rounded transition-all group ${isH1
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <Heading1Icon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Heading 2 */}
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-1 rounded transition-all group ${isH2
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <Heading2Icon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Heading 3 */}
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-1 rounded transition-all group ${isH3
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <Heading3Icon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Bold */}
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1 rounded transition-all group ${isBold
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <BoldIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Italic */}
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1 rounded transition-all group ${isItalic
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <ItalicIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Underline */}
                    <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-1 rounded transition-all group ${isUnderline
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <UnderlineIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Strikethrough */}
                    <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`p-1 rounded transition-all group ${isStrike
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <StrikethroughIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Bullet List */}
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1 rounded transition-all group ${isBulletList
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <ListIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Blockquote */}
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-1 rounded transition-all group ${isBlockquote
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <TextQuoteIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Highlight */}
                    {/* <button
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={`p-1 rounded transition-all group ${isHighlight
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <HighlighterIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button> */}
                    {/* Highlight với dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowHighlightDropdown(!showHighlightDropdown)}
                            className={`p-1 rounded transition-all group ${isHighlight
                                ? 'text-green-500 shadow-md'
                                : 'bg-white text-black'
                                }`}
                            title="Highlight Colors"
                        >
                            <HighlighterIcon className="group-hover:scale-125 transition-transform duration-200" />
                        </button>

                        {/* Dropdown màu - chỉ hiện khi showHighlightDropdown = true */}
                        {showHighlightDropdown && (
                            <div
                                className="absolute top-full mt-1 left-[-50px] bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 flex gap-2"

                            >
                                {[
                                    { bg: '#fef3c7', border: '#fbbf24', name: 'Yellow' },
                                    { bg: '#d1fae5', border: '#10b981', name: 'Green' },
                                    { bg: '#dbeafe', border: '#3b82f6', name: 'Blue' },
                                    { bg: '#fee2e2', border: '#ef4444', name: 'Red' },
                                    { bg: '#e9d5ff', border: '#a855f7', name: 'Purple' },
                                ].map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            editor.chain().focus().toggleHighlight({ color: color.bg }).run()
                                            setShowHighlightDropdown(false) // Đóng dropdown sau khi chọn
                                        }}
                                        className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${editor.isActive('highlight', { color: color.bg })
                                            ? 'ring-2 ring-offset-1 ring-green-500'
                                            : ''
                                            }`}
                                        style={{
                                            backgroundColor: color.bg,
                                            borderColor: color.border
                                        }}
                                        title={`${color.name} Highlight`}
                                    />
                                ))}

                                {/* Button xóa highlight */}
                                <button
                                    onClick={() => {
                                        editor.chain().focus().unsetHighlight().run()
                                        setShowHighlightDropdown(false)
                                    }}
                                    className="w-6 h-6 rounded border-2 border-gray-300 hover:scale-110 transition-transform flex items-center justify-center bg-white"
                                    title="Remove Highlight"
                                >
                                    <span className="text-xs text-red-500 font-bold">✕</span>
                                </button>
                            </div>
                        )}
                    </div>


                    {/* Align Left */}
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`p-1 rounded transition-all group ${isAlignLeft ? 'text-green-500 shadow-md' : 'bg-white text-black'
                            }`}
                    >
                        <AlignLeftIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Align Center */}
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`p-1 rounded transition-all group ${isAlignCenter ? 'text-green-500 shadow-md' : 'bg-white text-black'
                            }`}
                    >
                        <AlignCenterIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* Align Right */}
                    <button
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`p-1 rounded transition-all group ${isAlignRight ? 'text-green-500 shadow-md' : 'bg-white text-black'
                            }`}
                    >
                        <AlignRightIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

                    {/* ========== IMAGE CONTROLS - Chỉ hiện khi select ảnh ========== */}
                    {isImageSelected && (
                        <>
                            {/* Separator */}
                            <div className="w-px h-6 bg-gray-300 mx-2" />

                            {/* Image Size Buttons */}
                            <div className="flex gap-1 items-center bg-gray-50 px-2 py-1 rounded">
                                <button
                                    onClick={() => editor.chain().focus().setImageWidth('25%').run()}
                                    className="px-2 py-1 text-xs rounded hover:bg-white transition-all"
                                    title="Small (25%)"
                                >
                                    25%
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().setImageWidth('50%').run()}
                                    className="px-2 py-1 text-xs rounded hover:bg-white transition-all"
                                    title="Medium (50%)"
                                >
                                    50%
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().setImageWidth('75%').run()}
                                    className="px-2 py-1 text-xs rounded hover:bg-white transition-all"
                                    title="Large (75%)"
                                >
                                    75%
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().setImageWidth('100%').run()}
                                    className="px-2 py-1 text-xs rounded hover:bg-white transition-all"
                                    title="Full (100%)"
                                >
                                    100%
                                </button>
                            </div>

                            {/* Image Align Buttons - 👇 DÙNG STATE MỚI */}
                            <button
                                onClick={() => editor.chain().focus().setImageAlign('left').run()}
                                className={`p-1 rounded transition-all group ${imageAlignLeft
                                    ? 'text-green-500 shadow-md bg-green-50'
                                    : 'bg-white text-black'
                                    }`}
                                title="Align Left"
                            >
                                <AlignLeftIcon className="group-hover:scale-125 transition-transform duration-200" />
                            </button>

                            <button
                                onClick={() => editor.chain().focus().setImageAlign('center').run()}
                                className={`p-1 rounded transition-all group ${imageAlignCenter
                                    ? 'text-green-500 shadow-md bg-green-50'
                                    : 'bg-white text-black'
                                    }`}
                                title="Align Center"
                            >
                                <AlignCenterIcon className="group-hover:scale-125 transition-transform duration-200" />
                            </button>

                            <button
                                onClick={() => editor.chain().focus().setImageAlign('right').run()}
                                className={`p-1 rounded transition-all group ${imageAlignRight
                                    ? 'text-green-500 shadow-md bg-green-50'
                                    : 'bg-white text-black'
                                    }`}
                                title="Align Right"
                            >
                                <AlignRightIcon className="group-hover:scale-125 transition-transform duration-200" />
                            </button>
                        </>
                    )}

                    {/* Sparkles */}
                    {/* <button
                        onClick={() => onAiClick()}
                        className='hover:text-green-600 group'
                    >
                        <SparklesIcon className="animate-spin-float-glow " />

                        
                    </button> */}





                    <button
                        onClick={() => {
                            editor.chain().focus().setImageUploadNode().run()
                        }}
                        className="p-1 rounded transition-all group bg-white text-black hover:text-green-500"
                        title="Upload Image"
                    >
                        <ImageIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>




                    <button
                        onClick={() => onAiClick()}
                        className='p-1 hover:scale-110 transition-all ml-3 cursor-pointer flex-shrink-0'
                    >
                        <div className="animate-spin-float-glow">
                            <Image
                                src="/CS_Star_4.svg"
                                alt="AI"
                                width={28}
                                height={28}
                            />
                        </div>
                    </button>

                    {isImageSelected && (
                        <>
                            <div className="w-px h-6 bg-gray-300 mx-2" />

                            <button
                                onClick={onImageSearchClick}
                                disabled={isProcessingImage}
                                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-2 ${isProcessingImage
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-700 to-orange-500 text-white hover:scale-105 shadow-md'
                                    }`}
                                title="Find this image in PDF"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                {isProcessingImage ? 'Processing...' : 'Find this image in PDF'}
                            </button>
                        </>
                    )}

                    {/* Download */}
                    <button onClick={download} className='ml-3'>
                        <DownloadIcon className="hover:scale-125 transition-transform duration-200" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditorExtension