'use client'
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import { useAction, useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { Loader2Icon, CircleCheckIcon } from 'lucide-react'
import { v4 as uuid4 } from 'uuid';
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { toast } from 'sonner'


const UploadPDF = ({ children, isMaxFile }) => {

    const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl)
    const addFileEntry = useMutation(api.fileStorage.AddFileEntryToDb)
    const getFileUrl = useMutation(api.fileStorage.getFileUrl)
    const embededDocument = useAction(api.myAction.ingest)
    const { user } = useUser()
    const [file, setFile] = useState()
    const [loading, setLoading] = useState(false)
    const [fileName, setFileName] = useState('')
    const [open, setOpen] = useState(false)
    const [includeImages, setIncludeImages] = useState(false)
    const ingestWithImages = useAction(api.ingest.ingestPdfWithImages)

    // Function để truncate tên file dài
    const truncateFileName = (name, maxLength = 60) => {
        if (name.length <= maxLength) return name
        const start = name.substring(0, 12)
        const end = name.substring(name.length - 12)
        return `${start}...${end}`
    }

    const OnFileSelect = (event) => {
        const selectedFile = event.target.files[0]
        setFile(selectedFile)
        // Tự động set tên file mặc định (bỏ extension .pdf)
        if (selectedFile) {
            const defaultName = selectedFile.name.replace('.pdf', '')
            setFileName(defaultName)
        }
    }

    const OnUpload = async () => {
        setLoading(true)

        if (!file) {
            setLoading(false)
            toast.error('Please select pdf')
            return;
        }

        try {
            // 1. Upload file lên storage
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file?.type },
                body: file,
            });
            const { storageId } = await result.json()
            const fileId = uuid4()
            const fileUrl = await getFileUrl({ storageId: storageId })
            const finalFileName = fileName.trim() || file.name.replace('.pdf', '')

            // 2. Generate thumbnail
            let thumbnailStorageId = null;
            let thumbnailUrl = null;

            try {
                const thumbResponse = await axios.post('/api/generate-thumbnail', { pdfUrl: fileUrl });

                if (thumbResponse.data.thumbnailData) {
                    // Convert base64 to blob
                    const base64Data = thumbResponse.data.thumbnailData.split(',')[1];
                    const binaryData = atob(base64Data);
                    const uint8Array = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        uint8Array[i] = binaryData.charCodeAt(i);
                    }
                    const blob = new Blob([uint8Array], { type: 'application/pdf' });

                    // Upload thumbnail
                    const thumbPostUrl = await generateUploadUrl();
                    const thumbResult = await fetch(thumbPostUrl, {
                        method: "POST",
                        headers: { "Content-Type": 'application/pdf' },
                        body: blob,
                    });
                    const thumbData = await thumbResult.json();
                    thumbnailStorageId = thumbData.storageId;
                    thumbnailUrl = await getFileUrl({ storageId: thumbnailStorageId });
                }
            } catch (thumbError) {
                console.error('Thumbnail generation failed:', thumbError);
                // Continue without thumbnail
            }

            // 3. Save file entry với thumbnail
            await addFileEntry({
                filedId: fileId,
                storageId: storageId,
                fileName: finalFileName,
                fileUrl: fileUrl,
                thumbnailStorageId: thumbnailStorageId,
                thumbnailUrl: thumbnailUrl,
                createdBy: user?.primaryEmailAddress?.emailAddress
            })

            // 4. Process PDF chunks
            if (includeImages) {
                // Dùng Gemini Multimodal
                console.log('Using Gemini Multimodal approach...');
                await ingestWithImages({
                    pdfUrl: fileUrl,
                    fileId: fileId
                });
            } else {
                // Dùng cách cũ (chỉ text)
                console.log('Using text-only approach...');
                const ApiResp = await axios.get('/api/pdf-loader?pdfUrl=' + encodeURIComponent(fileUrl))
                await embededDocument({
                    splitText: ApiResp.data.result,
                    fileId: fileId,
                    metadata: ApiResp.data.metadata
                })
            }


            setLoading(false)
            setOpen(false)
            setFileName('')
            setFile(null)

            toast.success('File is ready', {
                icon: <CircleCheckIcon size={16} className="text-emerald-600" />
            })
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Upload failed')
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)} disabled={isMaxFile} className='w-full hover:scale-105 transition-all duration-200'>+ Upload PDF</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload PDF File</DialogTitle>
                    <DialogDescription asChild>
                        <div className=''>


                            {/* Box tick */}
                            <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                                <label className='flex items-start space-x-3 cursor-pointer'>
                                    <input
                                        type="checkbox"
                                        checked={includeImages}
                                        onChange={(e) => setIncludeImages(e.target.checked)}
                                        className='mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                                    />
                                    <div className='flex-1'>
                                        <span className='text-sm font-semibold text-gray-800 block'>
                                            Image Analysis in PDF (AI Vision)
                                        </span>
                                        <p className='text-xs text-gray-600 mt-1'>

                                            <span className='font-medium'> Takes another 30-60 seconds</span>
                                        </p>

                                    </div>
                                </label>
                            </div>



                            <h2 className='mt-5'>Select a file to upload</h2>
                            <div className='gap-2 p-3 rounded-md border'>
                                <input
                                    type="file"
                                    accept='application/pdf'
                                    className="
                                        block  text-sm text-slate-500 
                                        file:mr-4 file:py-2 file:px-4

                                        file:rounded-lg file:border
                                        file:border-gray-500 file:text-sm file:font-semibold
                                        file:bg-gray-100 file:text-gray-700
        
                                    "
                                    onChange={(event) => OnFileSelect(event)}
                                />
                            </div>
                            <div className='mt-2'>
                                <label className='text-sm text-gray-600'>
                                    File Name <span className='text-gray-500'>(optional)</span>
                                </label>
                                <Input
                                    placeholder='Enter custom name or use default'
                                    value={fileName}
                                    onChange={(event) => setFileName(event.target.value)}
                                />
                            </div>

                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                        <Button className='hover:bg-slate-200 hover:scale-105 transition-all duration-200' type="button" variant="secondary" onClick={() => {
                            setFile(null)
                            setFileName('')
                            setOpen(false)
                        }}>
                            Close
                        </Button>
                    </DialogClose>
                    <Button onClick={OnUpload} disabled={loading}>{loading ? <Loader2Icon className='animate-spin' /> : 'Upload'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default UploadPDF