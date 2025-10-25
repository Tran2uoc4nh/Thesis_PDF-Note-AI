'use client'
import React from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useEffect } from 'react'
import UploadPDF from './_components/UploadPDF'
import Link from 'next/link'
import Image from 'next/image'
const Dashboard = () => {
    const { user } = useUser()

    //Moved From  Default Page to Dashboard Page
    //
    const createUser = useMutation(api.user.createUser);

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

    return (
        <div>
            <div className='flex justify-between items-center'>
                <h2 className='font-medium text-3xl'>Workspace</h2>
                <div className='w-[200px]'>
                    <UploadPDF />
                </div>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-10'>
                {fileList?.length > 0 ? fileList?.map((file, index) => (
                    <Link key={index} href={'/workspace/' + file.fileId}>
                        <div key={index} className='flex p-5 shadow-md rounded-md flex-col items-center justify-center border cursor-pointer hover: scale-105 transition-all'>
                            <Image src={'/pdf.png'} alt={file.fileName} width={100} height={100} />
                            <h2 className='mt-3 font-medium text-lg'>{file?.fileName}</h2>

                        </div>
                    </Link>
                ))
                    : [1, 2, 3, 4, 5].map((item, index) => (
                        <div key={index} className='bg-slate-200 rounded-md h-[100px] animate-pulse'></div>
                    ))

                }
            </div>

        </div>
    )
}

export default Dashboard