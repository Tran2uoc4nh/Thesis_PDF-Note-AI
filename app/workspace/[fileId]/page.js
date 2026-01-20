'use client'
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import WorkspaceHeader from '../_components/WorkspaceHeader'
import PdfViewer from '../_components/PdfViewer'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import TextEditor from '../_components/TextEditor'
import { FileSaveContext } from '@/app/_context/FileSaveContext'
import { useUser } from '@clerk/nextjs'

const Workspace = () => {
    const { fileId } = useParams()
    const fileInfo = useQuery(api.fileStorage.GetFileRecord, { fileId: fileId })
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [editorRef, setEditorRef] = useState(null)

    const addNotes = useMutation(api.notes.AddNotes)
    const { user } = useUser()

    const handleSave = async () => {
        // This will be called from WorkspaceHeader
        // Save logic here if needed
        return true
    }

    return (
        <div className='h-screen overflow-hidden flex flex-col'>
            <WorkspaceHeader
                fileName={fileInfo?.fileName}
                hasUnsavedChanges={hasUnsavedChanges}
                onSave={handleSave}
            />

            <div className='grid grid-cols-2 flex-1 overflow-hidden'>
                <div className='h-full overflow-hidden'>
                    <PdfViewer fileUrl={fileInfo?.fileUrl} />
                </div>
                <div className='h-full overflow-hidden'>
                    <TextEditor
                        fileId={fileId}
                        onUnsavedChanges={setHasUnsavedChanges}
                    />
                </div>
            </div>
        </div>
    )
}

export default Workspace