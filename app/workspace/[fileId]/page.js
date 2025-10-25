'use client'
import React, { useContext } from 'react'
import { useParams } from 'next/navigation'
import WorkspaceHeader from '../_components/WorkspaceHeader'
import PdfViewer from '../_components/PdfViewer'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import TextEditor from '../_components/TextEditor'
import { FileSaveContext } from '@/app/_context/FileSaveContext'

const Workspace = () => {
    const { fileId } = useParams()
    const fileInfo = useQuery(api.fileStorage.GetFileRecord, { fileId: fileId })

    return (
        <div className='h-screen overflow-hidden flex flex-col'>
            <WorkspaceHeader fileName={fileInfo?.fileName} />

            <div className='grid grid-cols-2 flex-1 overflow-hidden'>
                <div className='h-full overflow-hidden' >
                    {/* PDF Viewer */}
                    <PdfViewer fileUrl={fileInfo?.fileUrl} />
                </div>
                <div className=' h-full overflow-hidden'>
                    {/* Text editor */}
                    <TextEditor fileId={fileId} />
                </div>
            </div>
        </div>
    )
}

export default Workspace