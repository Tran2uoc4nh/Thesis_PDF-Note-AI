'use client'
import React from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Crown } from 'lucide-react'


const Header = () => {
    const { user } = useUser();
    const userInfo = useQuery(api.user.GetUserInfo, {
        userEmail: user?.primaryEmailAddress?.emailAddress
    });

    return (
        <div className='flex justify-end items-center gap-3 p-5 shadow-sm'>
            {userInfo?.upgrade && (
                <div className='flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-2xl shadow-md'>
                    <span className='text-lg'><Crown /></span>
                    <span className='font-bold text-lg text-gray-800'>Pro</span>
                </div>
            )}
            <UserButton
                appearance={{
                    elements: {
                        avatarBox: "w-30 h-30 border-1 border-black"
                    }
                }}
            />
        </div>
    )
}

export default Header