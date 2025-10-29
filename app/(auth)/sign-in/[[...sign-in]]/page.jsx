'use client'
import { SignIn } from '@clerk/nextjs'
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
        <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
            {/* Neat Gradient Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />

            {/* Sign In Card with Animation */}
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
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "shadow-2xl rounded-2xl backdrop-blur-md bg-white/90 border border-white/20",
                            header: "hidden",
                            headerTitle: "hidden",
                            headerSubtitle: "text-gray-600",
                            socialButtonsBlockButton: "border-2 border-gray-700 hover:bg-slate-400 hover:scale-105 transition-all ease-in-out duration-700",
                            formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all",
                            footerActionLink: "text-green-600 hover:text-green-700",
                            formFieldInput: "rounded-lg border-gray-300 focus:ring-green-500",
                            footer: "mt-6",
                            footerActionText: "text-gray-800",
                            footerActionLink: "text-green-700 hover:text-green-800 font-semibold",
                        },
                        layout: {
                            socialButtonsPlacement: "top",
                            socialButtonsVariant: "blockButton",
                        },
                        variables: {
                            colorPrimary: "#2E7D32",
                            colorBackground: "rgba(255, 255, 255, 0.9)",
                            colorText: "#111827",
                            colorTextSecondary: "#6b7280",
                            colorInputBackground: "#ffffff",
                            colorInputText: "#111827",
                            borderRadius: "0.75rem",
                            fontFamily: "inherit",
                        },
                    }}
                />
            </div>
        </div>
    )
}