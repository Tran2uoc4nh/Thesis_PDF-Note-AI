'use client'
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Files, ArrowBigUp } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import UploadPDF from './UploadPDF'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const SideBar = () => {
    const { user } = useUser()
    const path = usePathname()

    const GetUserInfo = useQuery(api.user.GetUserInfo, {
        userEmail: user?.primaryEmailAddress?.emailAddress
    })

    const fileList = useQuery(api.fileStorage.GetUserFiles, {
        userEmail: user?.primaryEmailAddress?.emailAddress
    })

    return (
        <div className='shadow-md h-screen p-7'>
            {/* Logo */}
            <Link href='/'>
                <Image src="/logo3.svg" alt="logo" width={170} height={100} />
            </Link>

            <div className='mt-10'>
                {/* Nút Upload */}
                <UploadPDF isMaxFile={(fileList?.length >= 5 && !GetUserInfo.upgrade) ? true : false}>
                    <Button className='w-full'>+ Upload PDF</Button>
                </UploadPDF>
                <Link href='/dashboard'>
                    {/* Nút Workspace */}
                    <div className={`flex items-center gap-2 p-3 mt-7 cursor-pointer  hover:bg-slate-100 
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-1 rounded-xl ${path == '/dashboard' && 'bg-slate-100'}`}>
                        <Files />
                        <h2>
                            Workspace
                        </h2>
                    </div>
                </Link>

                <Link href='/dashboard/upgrade'>
                    {/* Nút Upgrade Plan */}
                    <div className={`flex items-center gap-2 p-3 mt-2 cursor-pointer  hover:bg-slate-100 
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-1 rounded-xl ${path == '/dashboard/upgrade' && 'bg-slate-200'}`} >
                        <ArrowBigUp />
                        <h2>
                            Upgrade Plan
                        </h2>
                    </div>
                </Link>
            </div>

            {/* Progress Bar */}
            <div className='absolute bottom-24 w-[80%]'>
                <Progress value={(fileList?.length / 5) * 100} />
                <p className='text-sm text-gray-500'>{fileList?.length} out of 5 PDF Uploaded</p>

                <p className='text-xs mt-2 text-gray-400 '>Upgrade to Upload more</p>
            </div>

        </div>
    )
}

export default SideBar