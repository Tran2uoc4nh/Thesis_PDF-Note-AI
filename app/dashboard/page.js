'use client'
import React from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useEffect } from 'react'
import UploadPDF from './_components/UploadPDF'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { X } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import PDFThumbnail from './_components/PDFThumbnail'


const Dashboard = () => {
    const { user } = useUser()
    const [fileToDelete, setFileToDelete] = useState(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const createUser = useMutation(api.user.createUser);
    const deleteFile = useMutation(api.fileStorage.DeleteFile);


    useEffect(() => {
        user && CheckUser();
    }, [user])

    const CheckUser = async () => {
        const result = await createUser({
            email: user?.primaryEmailAddress?.emailAddress,
            imageUrl: user?.imageUrl,
            userName: user?.fullName
        });
    }
    //

    const fileList = useQuery(api.fileStorage.GetUserFiles, {
        userEmail: user?.primaryEmailAddress?.emailAddress
    })

    const handleDeleteClick = (e, file) => {
        e.preventDefault() // Ngăn Link navigate
        e.stopPropagation() // Ngăn event bubble
        setFileToDelete(file)
        setShowDeleteDialog(true)
    }

    const handleConfirmDelete = async () => {
        if (fileToDelete) {
            try {
                await deleteFile({ fileId: fileToDelete.fileId })
                toast.success('File deleted successfully')
                setShowDeleteDialog(false)
                setFileToDelete(null)
            } catch (error) {
                toast.error('Failed to delete file')
            }
        }
    }



    // return (
    //     <div>
    //         <div className='flex justify-between items-center'>
    //             <h2 className='font-medium text-3xl'>Workspace</h2>
    //             <div className='w-[200px]'>
    //                 <UploadPDF />
    //             </div>
    //         </div>

    //         <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-10'>
    //             {fileList?.length > 0 ? fileList?.map((file, index) => (
    //                 <Link key={index} href={'/workspace/' + file.fileId}>
    //                     <div key={index} className='flex p-5 shadow-md rounded-md flex-col items-center justify-center border cursor-pointer hover:scale-105 transition-all'>
    //                         <Image src={'/pdf.png'} alt={file.fileName} width={100} height={100} />
    //                         <h2 className='mt-3 font-medium text-lg'>{file?.fileName}</h2>

    //                     </div>
    //                 </Link>
    //             ))
    //                 : [1, 2, 3, 4, 5].map((item, index) => (
    //                     <div key={index} className='bg-slate-200 rounded-md h-[100px] animate-pulse'></div>
    //                 ))

    //             }
    //         </div>

    //     </div>
    // )
    return (
        <div>
            <div className='flex justify-between items-center'>
                <h2 className='font-medium text-3xl'>Workspace</h2>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-10'>
                {fileList?.length > 0 ? fileList?.map((file, index) => (
                    <Link key={index} href={'/workspace/' + file.fileId}>
                        <div className='relative group flex p-5 shadow-md rounded-md flex-col items-center justify-center border cursor-pointer hover:scale-105 transition-all'>
                            {/* Delete Button - chỉ hiện khi hover */}
                            <button
                                onClick={(e) => handleDeleteClick(e, file)}
                                className='absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10'
                            >
                                <X size={16} />
                            </button>

                            {/* <Image src={'/pdf.png'} alt={file.fileName} width={100} height={100} /> */}
                            {/* PDF Thumbnail thay vì icon */}
                            <PDFThumbnail fileUrl={file.fileUrl} fileName={file.fileName} />

                            <h2 className='mt-3 font-medium text-lg text-center'>{file?.fileName}</h2>
                        </div>
                    </Link>
                ))
                    : [1, 2, 3, 4, 5].map((item, index) => (
                        <div key={index} className='bg-slate-200 rounded-md h-[100px] animate-pulse'></div>
                    ))
                }
            </div>

            {/* Delete Confirmation Dialog */}
            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you certain you want to delete ?</DialogTitle>
                        <DialogDescription>
                            File "<u className='text-red-500'>{fileToDelete?.fileName}</u>" will be deleted <b>permanently</b>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Dashboard