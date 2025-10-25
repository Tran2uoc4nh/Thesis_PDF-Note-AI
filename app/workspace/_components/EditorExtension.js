'use client'
import React, { useState, useEffect, useContext } from 'react'
import { BoldIcon, ItalicIcon, UnderlineIcon, Heading1Icon, Heading2Icon, Heading3Icon, StrikethroughIcon, ListIcon, TextQuoteIcon, HighlighterIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, SparklesIcon, DownloadIcon } from 'lucide-react'
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
    const [isAlignLeft, setIsAlignLeft] = useState(false)
    const [isAlignCenter, setIsAlignCenter] = useState(false)
    const [isAlignRight, setIsAlignRight] = useState(false)
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

    // Lưu History
    const [conversationHistory, setConversationHistory] = useState([]);

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
            const header = `[C${validChunkCount}] (trang ${page}, chunk ${chunkId})`;

            formattedContext += `${header}\n${content}\n\n`;
        });

        if (!formattedContext.trim()) {
            formattedContext = "[NO RELEVANT CONTEXT FOUND]";
        }

        // Build conversation history string
        let historyString = '';
        if (conversationHistory.length > 0) {
            historyString = '\n\nPREVIOUS CONVERSATION:\n';
            conversationHistory.forEach((msg, i) => {
                if (i % 2 === 0) {
                    historyString += `User: ${msg}\n`;
                } else {
                    historyString += `Assistant: ${msg}\n\n`;
                }
            });
        }

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
        8. Answer in the SAME LANGUAGE as the user's question.
        9. Provide answer in HTML format with <mark> tags to highlight key information.
        Remember: It is better to say "I don't know" than to provide information not in the document or previous conversation.
        
        Current Question: "${selectedText}"
        
        Answer:`;


        const AiModelResult = await chatSession.sendMessage(PROMPT);
        const response = AiModelResult.response.text();
        console.log("AI Response:", response);

        const FinalAns = response.replace(/```html/g, '').replace(/```/g, '');

        // Update conversation history (keep last 6 messages = 3 Q&A pairs)
        const newHistory = [...conversationHistory, selectedText, FinalAns];
        const recentHistory = newHistory.slice(-6); // Keep only last 6 messages
        setConversationHistory(recentHistory);

        console.log("Conversation history:", recentHistory.length / 2, "Q&A pairs");

        const AllText = editor.getHTML();
        editor.commands.setContent(AllText + '<p> <strong>Answer: </strong>' + FinalAns + ' </p>');


        addNotes({
            notes: editor.getHTML(),
            fileId: fileId,
            createdBy: user?.primaryEmailAddress?.emailAddress
        })
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
                    <button
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={`p-1 rounded transition-all group ${isHighlight
                            ? 'text-green-500 shadow-md'
                            : 'bg-white text-black'
                            }`}
                    >
                        <HighlighterIcon className="group-hover:scale-125 transition-transform duration-200" />
                    </button>

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

                    {/* Sparkles */}
                    {/* <button
                        onClick={() => onAiClick()}
                        className='hover:text-green-600 group'
                    >
                        <SparklesIcon className="animate-spin-float-glow " />

                    </button> */}
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


                    {/* Download */}
                    <button onClick={download} className='ml-57'>
                        <DownloadIcon className="hover:scale-125 transition-transform duration-200" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditorExtension