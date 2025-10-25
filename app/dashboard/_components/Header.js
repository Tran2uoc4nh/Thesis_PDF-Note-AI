import React from 'react'
import { UserButton } from '@clerk/nextjs'

const Header = () => {
    return (
        <div className='flex justify-end items-center p-5 shadow-sm'>
            <UserButton />
        </div>
    )
}

export default Header