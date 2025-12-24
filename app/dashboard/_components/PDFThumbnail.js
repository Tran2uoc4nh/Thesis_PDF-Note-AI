'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { FileText } from 'lucide-react'

const PDFThumbnail = ({ thumbnailUrl, fileName }) => {
    const [imageError, setImageError] = useState(false)

    if (!thumbnailUrl || imageError) {
        // Fallback to icon
        return (
            <div className='w-[220px] h-[180px] flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200'>
                <FileText size={48} className='text-red-600' />
                <div className='mt-2 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full'>
                    PDF
                </div>
            </div>
        )
    }

    return (
        <div className='w-[220px] h-[180px] relative overflow-hidden rounded-lg border border-gray-200 bg-white'>
            <iframe
                src={`${thumbnailUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                className='w-[220px] h-full pointer-events-none border-0'
                style={{
                    transform: 'scale(1.1)',
                    transformOrigin: 'top center'
                }}
                onError={() => setImageError(true)}
            />
        </div>
    )
}

export default PDFThumbnail