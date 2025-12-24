'use client'
import React, { useContext, useState, useEffect } from 'react'
import Image from 'next/image'
import { UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { FileSaveContext } from '@/app/_context/FileSaveContext'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const WorkspaceHeader = ({ fileName, hasUnsavedChanges, onSave }) => {
    const { fileSave, setFileSave } = useContext(FileSaveContext);
    const [showDialog, setShowDialog] = useState(false);
    const router = useRouter();

    const handleLogoClick = (e) => {
        e.preventDefault();

        // Nếu có thay đổi chưa save, hiện dialog
        if (hasUnsavedChanges) {
            setShowDialog(true);
        } else {
            // Không có thay đổi, navigate luôn
            router.push('/dashboard');
        }
    };

    const handleSaveAndLeave = async () => {
        // Trigger save
        if (onSave) {
            await onSave();
        }
        setFileSave(Date.now());

        // Wait a bit for save to complete, then navigate
        setTimeout(() => {
            router.push('/dashboard');
        }, 500);
    };

    const handleLeaveWithoutSaving = () => {
        router.push('/dashboard');
    };

    return (
        <>
            <div className='flex justify-between items-center p-5 shadow-md'>
                <div onClick={handleLogoClick} className="cursor-pointer">
                    <Image src='/logo3.svg' alt='logo' width={140} height={100} />
                </div>

                <h2 className='font-bold'> {fileName}</h2>

                <div className='flex gap-6 items-center'>
                    <Button onClick={() => setFileSave(Date.now())}>Save</Button>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-30 h-30 border-1 border-black"
                            }
                        }}
                    />
                </div>
            </div>

            {/* Confirm Dialog */}
            <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Save changes ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Would you like to save before leaving this page?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            variant="outline"
                            onClick={handleLeaveWithoutSaving}
                        >
                            Don't save
                        </Button>
                        <AlertDialogAction onClick={handleSaveAndLeave}>
                            Save and leave
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default WorkspaceHeader