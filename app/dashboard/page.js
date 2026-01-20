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
import { X, FileText, Clock, Grid3x3, List, ArrowDownUp, ArrowUp, ArrowDown } from 'lucide-react'
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


const formatDate = (timestamp, viewMode) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    // Tính số phút còn lại sau khi trừ giờ
    const remainingMins = diffMins % 60

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    if (viewMode === 'grid') {
        if (diffMins < 1) return `Just now - ${day}/${month}/${year}`
        if (diffMins < 60) return `${diffMins}m ago - ${day}/${month}/${year}`
        if (diffHours < 24) return `${diffHours}h ago - ${day}/${month}/${year}`
        if (diffDays < 7) return `${diffDays}d ago - ${day}/${month}/${year}`
        return `${day}/${month}/${year}`
    } else {
        if (diffMins < 1) return `Just now - ${day}/${month}/${year}`
        if (diffMins < 60) return `${diffMins}m ago - ${day}/${month}/${year}`
        if (diffHours < 24) return `${diffHours}h ${remainingMins}m ago - ${day}/${month}/${year}`
        if (diffDays < 7) return `${diffDays}d ago - ${day}/${month}/${year}`
        return `${day}/${month}/${year}`
    }
}



const Dashboard = () => {
    const { user } = useUser()
    const [fileToDelete, setFileToDelete] = useState(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    // Dùng mounted flag
    const [mounted, setMounted] = useState(false)

    // Khởi tạo với default value, load từ localStorage sau
    const [viewMode, setViewMode] = useState('grid')
    const [sortBy, setSortBy] = useState('date')
    const [sortOrder, setSortOrder] = useState('desc')


    //Load từ localStorage SAU KHI component mount
    useEffect(() => {
        setMounted(true)

        // Load preferences từ localStorage
        const savedViewMode = localStorage.getItem('dashboardViewMode')
        const savedSortBy = localStorage.getItem('dashboardSortBy')
        const savedSortOrder = localStorage.getItem('dashboardSortOrder')

        if (savedViewMode) setViewMode(savedViewMode)
        if (savedSortBy) setSortBy(savedSortBy)
        if (savedSortOrder) setSortOrder(savedSortOrder)
    }, [])

    // Lưu viewMode vào localStorage mỗi khi thay đổi
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('dashboardViewMode', viewMode)
        }
    }, [viewMode, mounted])

    // Lưu sort preferences
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('dashboardSortBy', sortBy)
            localStorage.setItem('dashboardSortOrder', sortOrder)
        }
    }, [sortBy, sortOrder, mounted])

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

    // Function để sort files
    const getSortedFiles = (files) => {
        if (!files) return files

        const sorted = [...files].sort((a, b) => {
            if (sortBy === 'name') {
                // Sort by filename
                const nameA = a.fileName.toLowerCase()
                const nameB = b.fileName.toLowerCase()
                return sortOrder === 'asc'
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA)
            } else {
                // Sort by date (_creationTime)
                return sortOrder === 'asc'
                    ? a._creationTime - b._creationTime
                    : b._creationTime - a._creationTime
            }
        })

        return sorted
    }

    // Toggle sort
    const toggleSort = (type) => {
        if (sortBy === type) {
            // Nếu đang sort theo type này, đổi order
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            // Nếu sort theo type mới, set type và default desc
            setSortBy(type)
            setSortOrder('desc')
        }
    }


    return (
        <div>
            <div className='flex-row items-center gap-4'>
                <h2 className='font-medium text-3xl'>Workspace</h2>
            </div>

            <div className='flex justify-between items-center gap-2 border-b pt-5 pb-2'>
                <div className='flex items-center gap-2'>
                    {/* Sort by Name */}
                    <button
                        onClick={() => toggleSort('name')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${mounted && sortBy === 'name'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <ArrowDownUp size={16} />
                        {mounted && sortBy === 'name' && (
                            sortOrder === 'asc' ? `A - Z` : 'Z - A'
                        )}
                    </button>

                    {/* Sort by Date */}
                    <button
                        onClick={() => toggleSort('date')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${mounted && sortBy === 'date'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Clock size={16} />
                        <span className='text-sm font-medium'>Date</span>
                        {mounted && sortBy === 'date' && (
                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                    </button>
                </div>

                <div className='flex items-center gap-2'>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`hover:scale-105 flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'grid'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Grid3x3 size={18} />
                        <span className='text-sm font-medium'>Grid</span>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`hover:scale-105 flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'list'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <List size={18} />
                        <span className='text-sm font-medium'>List</span>
                    </button>
                </div>

            </div>



            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className='flex flex-wrap gap-10 mt-10 justify-start'>
                    {getSortedFiles(fileList)?.length > 0 ? getSortedFiles(fileList)?.map((file, index) => (
                        <Link key={index} href={'/workspace/' + file.fileId}>
                            <div className='w-[250px] relative group flex p-5 shadow-md rounded-md flex-col items-center justify-center border border-gray-500 cursor-pointer hover:scale-105 transition-all'>
                                <button
                                    onClick={(e) => handleDeleteClick(e, file)}
                                    className='absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10'
                                >
                                    <X size={16} />
                                </button>

                                <PDFThumbnail
                                    thumbnailUrl={file.thumbnailUrl}
                                    fileName={file.fileName}
                                />
                                <div className='w-full mt-3'>
                                    {/* File Name */}
                                    <div className='h-[90px] flex justify-center items-center'>
                                        <h2 className='font-medium text-lg text-center line-clamp-3 break-words overflow-wrap-anywhere'>
                                            {file?.fileName}
                                        </h2>
                                    </div>

                                    <div className='mt-3 text-xs text-gray-400 flex items-center justify-center gap-1'>
                                        <Clock size={14} />
                                        <span>{formatDate(file._creationTime, viewMode)}</span>
                                    </div>
                                </div>

                            </div>
                        </Link>
                    ))
                        : [1, 2, 3, 4, 5].map((item, index) => (
                            <div key={index} className='bg-slate-200 rounded-md h-[100px] animate-pulse'></div>
                        ))
                    }
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className='flex flex-col gap-3 mt-10'>
                    {getSortedFiles(fileList)?.length > 0 ? getSortedFiles(fileList)?.map((file, index) => (
                        <Link key={index} href={'/workspace/' + file.fileId}>
                            <div className='relative group flex items-center gap-4 p-4 shadow-sm rounded-lg border border-gray-400 cursor-pointer hover:shadow-md hover:bg-gray-50 hover:scale-101 transition-all'>
                                {/* Delete Button */}
                                <button
                                    onClick={(e) => handleDeleteClick(e, file)}
                                    className='absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10'
                                >
                                    <X size={16} />
                                </button>

                                {/* Thumbnail - smaller in list view */}
                                <div className='w-20 h-20 flex-shrink-0'>
                                    <Image src={'/pdf.png'} alt={file.fileName} width={100} height={100} />
                                </div>

                                {/* File Info */}
                                <div className='justify-between flex-1 min-w-0'>
                                    <div className='flex '>
                                        <h2 className='font-medium text-lg text-center line-clamp-3'>
                                            {file?.fileName}
                                        </h2>
                                    </div>

                                    <div className='mt-3 text-xs text-gray-400 flex gap-1'>
                                        <Clock size={14} />
                                        <span>{formatDate(file._creationTime, viewMode)}</span>
                                    </div>
                                </div>

                                {/* Arrow indicator */}
                                <div className='text-gray-400'>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M7.5 15l5-5-5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))
                        : [1, 2, 3, 4, 5].map((item, index) => (
                            <div key={index} className='bg-slate-200 rounded-lg h-[88px] w-full animate-pulse'></div>
                        ))
                    }
                </div>
            )}



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