import React from 'react'
import SideBar from './_components/SideBar'
import Header from './_components/Header'

const DashBoardLayout = ({ children }) => {
    return (
        <div>
            <div className='md:w-64 h-screen fixed'>
                <SideBar />
            </div>
            <div className='md:ml-64 h-screen flex flex-col'>
                <Header />
                <div className='shadow-inner p-5 flex-1 overflow-auto'>
                    {children}
                </div>

            </div>
        </div>
    )
}

export default DashBoardLayout