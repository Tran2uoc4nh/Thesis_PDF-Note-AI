'use client'
import Typewriter from 'typewriter-effect';
import React from 'react'
import { useUser } from '@clerk/nextjs';

function Hero() {
    const { isLoaded, user } = useUser();
    return (
        <div className="relative min-h-screen pb-[250px]" id="home">
            <div className="relative pt-36 ml-auto">
                <div className="lg:w-2/3 text-center mx-auto">

                    <h1 className="text-gray-900 dark:text-white font-bold text-5xl md:text-6xl xl:text-7xl leading-normal ">
                        <Typewriter
                            onInit={(typewriter) => {
                                typewriter
                                    .typeString('Simplify ')
                                    .typeString('<span class="text-red-400 glass-text-effect">PDF</span> ')
                                    .typeString('<span class="text-yellow-300 glass-text-effect">Note</span>-Taking <br/> with')
                                    .typeString(' <span class="text-blue-300 glass-text-effect">AI</span>-Powered')
                                    .start();
                            }}
                            options={{
                                delay: 50,
                                cursor: '|',
                            }}
                        />
                    </h1>

                    <p className="mt-8 text-gray-700 dark:text-gray-300">
                        Elevate your note-taking experience with our AI-powered PDF app. Seamlessly extract key insights, summaries, and annotations from any PDF with just a few clicks
                    </p>


                    {/* Conditional Buttons */}
                    <div className="mt-16 flex flex-wrap justify-center gap-y-4 gap-x-6">
                        {!isLoaded ? (
                            // Loading state
                            <div className="h-11 w-32 bg-gray-200 animate-pulse rounded-full"></div>
                        ) : user ? (
                            // Đã login - hiện Get Started
                            <a
                                href="/dashboard"
                                className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-primary before:transition before:duration-300 hover:before:scale-110 active:duration-75 active:before:scale-95 sm:w-max"
                            >
                                <span className="relative text-base font-semibold text-white">
                                    Get started
                                </span>
                            </a>
                        ) : (
                            // Chưa login - hiện Sign In + Sign Up
                            <>
                                <a
                                    href="/sign-in"
                                    className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:border before:border-primary before:bg-transparent before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max"
                                >
                                    <span className="relative text-base font-semibold text-primary">
                                        Sign In
                                    </span>
                                </a>
                                <a
                                    href="/sign-up"
                                    className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-primary before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max"
                                >
                                    <span className="relative text-base font-semibold text-white">
                                        Sign Up
                                    </span>
                                </a>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Hero