'use client'
import React from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { FileSaveContext } from './_context/FileSaveContext';
import { useState } from 'react';

function Provider({ children }) {
    const [fileSave, setFileSave] = useState(0);
    const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    return (
        <ConvexProvider client={convex}>
            <FileSaveContext.Provider value={{ fileSave, setFileSave }}>
                {children}
            </FileSaveContext.Provider>
        </ConvexProvider>
    )
}

export default Provider