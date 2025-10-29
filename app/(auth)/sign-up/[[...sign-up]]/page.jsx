'use client'
import { SignUp } from '@clerk/nextjs'
import { useEffect, useRef, useState } from 'react'
import { NeatGradient } from '@firecms/neat'
import { forestConfig } from './gradient-config'

export default function Page() {
    const canvasRef = useRef(null)
    const gradientRef = useRef(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (!canvasRef.current || gradientRef.current) return

        gradientRef.current = new NeatGradient({
            ref: canvasRef.current,
            ...forestConfig
        })

        // Trigger animation sau khi component mount
        setTimeout(() => setIsVisible(true), 500)

        return () => {
            if (gradientRef.current) {
                gradientRef.current.destroy()
                gradientRef.current = null
            }
        }
    }, [])
    return (

        <div className='flex justify-center items-center h-screen'>
            {/* Neat Gradient Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
            <div
                className={`
                    relative z-10 
                    transition-all duration-1000 ease-out
                    ${isVisible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-10'
                    }
                `}
            >
                <SignUp />
            </div>
        </div>
    )
}