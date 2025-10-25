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
    const [fileName, setFileName] = useState()
    const [open, setOpen] = useState(false)

    const OnFileSelect = (event) => {
        setFile(event.target.files[0])
    }
    const OnUpload = async () => {
        setLoading(true)

        if (!file || !fileName) {
            setLoading(false)
            toast(!file ? 'Please select pdf' : 'Please enter filename')
            return;
        }

        // 1. Get a short-lived upload URL
        const postUrl = await generateUploadUrl();

        // 2. POST the file to the URL
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file?.type },
            body: file,
        });
        const { storageId } = await result.json()
        console.log(storageId)
        const fileId = uuid4()
        const fileUrl = await getFileUrl({ storageId: storageId })

        // 3.Save the newly allocated storage id to the database
        const resp = await addFileEntry({
            filedId: fileId,
            storageId: storageId,
            fileName: fileName ?? 'Untitled File',
            fileUrl: fileUrl,
            createdBy: user?.primaryEmailAddress?.emailAddress
        })


        // API call to fetch the PDF Process data

        const ApiResp = await axios.get('/api/pdf-loader?pdfUrl=' + fileUrl)
        await embededDocument({
            splitText: ApiResp.data.result,
            fileId: fileId,
            metadata: ApiResp.data.metadata
        })


        setLoading(false)
        setOpen(false)

        toast.success('File is ready', {
            icon: <CircleCheckIcon size={16} className="text-emerald-600" />
        })
    }
    return (
        <Dialog open={open}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)} disabled={isMaxFile} className='w-full'>+ Upload PDF</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload PDF File</DialogTitle>
                    <DialogDescription asChild>
                        <div className=''>
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
                                <label>File Name *</label>
                                <Input placeholder='Enter file name' onChange={(event) => setFileName(event.target.value)} />
                            </div>

                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
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