'use client'
import React, { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import EditorExtension from './EditorExtension'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { ColorHighlightPopover } from '@/components/tiptap-ui/color-highlight-popover'
import TextAlign from '@tiptap/extension-text-align'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import Image from '@tiptap/extension-image'
import { EditorContext } from '@tiptap/react'
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node'

import { MAX_FILE_SIZE, handleImageUpload } from '@/lib/tiptap-utils'
import '@/components/tiptap-node/image-upload-node/image-upload-node.scss'
import '@/components/tiptap-node/image-node/image-node.scss'

const TextEditor = ({ fileId, onUnsavedChanges }) => {

    const notes = useQuery(api.notes.GetNotes, {
        fileId: fileId
    })

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [initialContent, setInitialContent] = useState(null)

    const CustomImage = Image.extend({
        addAttributes() {
            return {
                ...this.parent?.(),
                width: {
                    default: null,

                    parseHTML: element => element.getAttribute('width'),
                    renderHTML: attributes => {
                        return {
                            width: attributes.width,
                        }
                    },
                },
                align: {
                    default: 'center',
                    parseHTML: element => element.getAttribute('data-align'),
                    renderHTML: attributes => {
                        return {
                            'data-align': attributes.align,
                        }
                    },
                },
            }
        },

        addCommands() {
            return {
                ...this.parent?.(),
                setImageAlign: (align) => ({ commands }) => {
                    return commands.updateAttributes('image', { align })
                },
                setImageWidth: (width) => ({ commands }) => {
                    return commands.updateAttributes('image', { width })
                },
            }
        },
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
            }),
            // 👇 Thêm Image extension
            CustomImage.configure({
                inline: false, // Block-level cho image-node
                allowBase64: true,
            }),
            ImageUploadNode.configure({
                accept: 'image/*',
                maxSize: MAX_FILE_SIZE, // 5MB
                limit: 3, // Tối đa 3 files cùng lúc
                upload: handleImageUpload,
                onError: (error) => {
                    console.error('Upload failed:', error)
                    // Có thể thêm toast notification
                },
                onSuccess: (url) => {
                    console.log('Upload success:', url)
                }
            })
        ],
        // Don't render immediately on the server to avoid SSR issues
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'focus:outline-none p-5 tiptap ProseMirror'
            }

        },
        onSelectionUpdate: ({ editor }) => {
            // Khi click ra ngoài (selection rỗng và không có text được chọn)
            const { from, to } = editor.state.selection
            if (from === to) {
                // Nếu cursor ở vị trí trống, xóa tất cả marks
                editor.commands.unsetAllMarks()
            }
        },

        // Track changes
        onUpdate: ({ editor }) => {
            if (initialContent && editor.getHTML() !== initialContent) {
                setHasUnsavedChanges(true)
                if (onUnsavedChanges) {
                    onUnsavedChanges(true)
                }
            }
        }
    })

    // useEffect(() => {
    //     editor && editor.commands.setContent(notes)
    // }, [notes && editor])

    // return (
    //     <EditorContext.Provider value={{ editor }}>
    //         <div className='h-full flex flex-col'>
    //             <EditorExtension editor={editor} />
    //             <div className='flex-1 overflow-y-auto mx-5 mb-5 editor-box border bg-white'>
    //                 <EditorContent editor={editor} role="presentation" />
    //             </div>
    //         </div>
    //     </EditorContext.Provider>
    // )
    // Load initial content
    useEffect(() => {
        if (editor && notes) {
            editor.commands.setContent(notes)
            setInitialContent(notes)
            setHasUnsavedChanges(false)
            if (onUnsavedChanges) {
                onUnsavedChanges(false)
            }
        }
    }, [notes, editor])

    // Reset unsaved changes when saved
    useEffect(() => {
        if (editor && !hasUnsavedChanges && editor.getHTML()) {
            setInitialContent(editor.getHTML())
        }
    }, [hasUnsavedChanges])

    return (
        <EditorContext.Provider value={{ editor }}>
            <div className='h-full flex flex-col'>
                <EditorExtension
                    editor={editor}
                    onSave={() => {
                        setHasUnsavedChanges(false)
                        if (onUnsavedChanges) {
                            onUnsavedChanges(false)
                        }
                    }}
                />
                <div className='flex-1 overflow-y-auto mx-5 mb-5 editor-box border bg-white'>
                    <EditorContent editor={editor} role="presentation" />
                </div>
            </div>
        </EditorContext.Provider>
    )
}

export default TextEditor