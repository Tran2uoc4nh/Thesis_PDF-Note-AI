import React from 'react'
import { Loader2Icon } from 'lucide-react'
const PdfViewer = ({ fileUrl }) => {
    if (!fileUrl) {
        return (
            <div className='flex flex-col items-center justify-center h-[90vh] gap-4'>
                <div className='relative'>
                    <Loader2Icon className='w-12 h-12 animate-spin text-green-500' />
                    <div className='absolute inset-0 w-12 h-12 rounded-full bg-green-500/20 animate-pulse'></div>
                </div>
                <div className='text-center'>
                    <p className='text-lg font-medium text-gray-700'>Loading PDF...</p>
                    <p className='text-sm text-gray-500'>Please wait a moment</p>
                </div>
            </div>
        )
    }
    const pdfUrlWithZoom = fileUrl ? `${fileUrl}#zoom=95` : ''
    return (
        <div>
            <iframe src={pdfUrlWithZoom} width='100%' height='90vh' className='h-[95vh]'></iframe>
        </div>
    )
}

export default PdfViewer