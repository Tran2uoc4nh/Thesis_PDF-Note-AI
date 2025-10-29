'use client'
import React from 'react'
import Image from 'next/image'
import { FileText } from 'lucide-react'

const PDFThumbnail = ({ fileUrl, fileName }) => {
    return (
        <div className='w-full h-[140px] flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 relative overflow-hidden group'>
            {/* Background pattern */}
            <div className='absolute inset-0 opacity-10'>
                <svg width="100%" height="100%">
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="red" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* PDF Icon */}
            <div className='relative z-10 transform group-hover:scale-110 transition-transform'>
                <FileText size={48} className='text-red-600' />
            </div>

            {/* PDF Label */}
            <div className='mt-2 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full'>
                PDF
            </div>
        </div>
    )
}

export default PDFThumbnail