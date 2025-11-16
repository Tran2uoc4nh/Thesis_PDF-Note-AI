import React from 'react'
import { UserButton } from '@clerk/nextjs'

const Header = () => {
    return (
        <div className='flex justify-end items-center p-5 shadow-sm'>
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