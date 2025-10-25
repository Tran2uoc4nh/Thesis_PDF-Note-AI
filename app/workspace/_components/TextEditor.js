'use client'
import React, { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import EditorExtension from './EditorExtension'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
const TextEditor = ({ fileId }) => {

    const notes = useQuery(api.notes.GetNotes, {
        fileId: fileId
    })

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Take notes or Chat with AI here...',
            }),
            Underline,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            })
        ],
        // Don't render immediately on the server to avoid SSR issues
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'focus:outline-none p-5'
            }
        },
        onSelectionUpdate: ({ editor }) => {
            // Khi click ra ngoài (selection rỗng và không có text được chọn)
            const { from, to } = editor.state.selection
            if (from === to) {
                // Nếu cursor ở vị trí trống, xóa tất cả marks
                editor.commands.unsetAllMarks()
            }
        }
    })

    useEffect(() => {
        editor && editor.commands.setContent(notes)
    }, [notes && editor])

    return (
        <div className='h-full flex flex-col'>
            <EditorExtension editor={editor} />
            <div className='flex-1 overflow-y-auto  mx-5 mb-5 editor-box border bg-white'>
                <EditorContent editor={editor} />
            </div>

        </div>
    )
}

export default TextEditor