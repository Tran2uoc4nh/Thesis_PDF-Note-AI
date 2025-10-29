'use client'
import React from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { FileSaveContext } from './_context/FileSaveContext';
import { useState } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

function Provider({ children }) {
    const [fileSave, setFileSave] = useState(0);
    const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    return (
        <ConvexProvider client={convex}>
            <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID }}>
                <FileSaveContext.Provider value={{ fileSave, setFileSave }}>
                    {children}
                </FileSaveContext.Provider>
            </PayPalScriptProvider>
        </ConvexProvider>
    )
}

export default Provider