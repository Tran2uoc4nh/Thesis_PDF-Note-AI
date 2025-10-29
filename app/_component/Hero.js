'use client'
import Typewriter from 'typewriter-effect';
import React from 'react'
import { TypeAnimation } from 'react-type-animation';
import { useUser } from '@clerk/nextjs';



function Hero() {
    const { isLoaded, user } = useUser();
    return (
        // <div className="relative" id="home">
        //     <div aria-hidden="true" className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20">
        //         <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700"></div>
        //         <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
        //     </div>
        //     <div>
        //         <div className="relative pt-36 ml-auto">
        //             <div className="lg:w-2/3 text-center mx-auto">
        //                 <h1 className="text-gray-900 dark:text-white font-bold text-5xl md:text-6xl xl:text-7xl">Simplify <span className='text-red-500'>PDF</span> <span className='text-blue-500'>Note</span>-Taking with AI-Powered </h1>
        //                 <p className="mt-8 text-gray-700 dark:text-gray-300">Elevate your note-taking experience with our AI-powered PDF app. Seamlessly extract key insights, summaries, and annotations from any PDF with just a few clicks</p>
        // <div className="mt-16 flex flex-wrap justify-center gap-y-4 gap-x-6">
        //     <a
        //         href="/dashboard"
        //         className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-primary before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max"
        //     >
        //         <span className="relative text-base font-semibold text-white"
        //         >Get started</span
        //         >
        //     </a>
        //     <a
        //         href="#"
        //         className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:border before:border-transparent before:bg-primary/10 before:bg-gradient-to-b before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 dark:before:border-gray-700 dark:before:bg-gray-800 sm:w-max"
        //     >
        //         <span
        //             className="relative text-base font-semibold text-primary dark:text-white"
        //         >Learn more</span
        //         >
        //     </a>
        // </div>
        //                 <div className="hidden py-8 mt-16 border-y border-gray-100 dark:border-gray-800 sm:flex justify-between">
        //                     <div className="text-left">
        //                         <h6 className="text-lg font-semibold text-gray-700 dark:text-white">The lowest price</h6>
        //                         <p className="mt-2 text-gray-500">Some text here</p>
        //                     </div>
        //                     <div className="text-left">
        //                         <h6 className="text-lg font-semibold text-gray-700 dark:text-white">The fastest on the market</h6>
        //                         <p className="mt-2 text-gray-500">Some text here</p>
        //                     </div>
        //                     <div className="text-left">
        //                         <h6 className="text-lg font-semibold text-gray-700 dark:text-white">The most loved</h6>
        //                         <p className="mt-2 text-gray-500">Some text here</p>
        //                     </div>
        //                 </div>
        //             </div>

        //         </div>
        //     </div>
        // </div>
        <div className="relative min-h-screen pb-[250px]" id="home">

            <div className="relative pt-36 ml-auto">
                <div className="lg:w-2/3 text-center mx-auto">

                    <h1 className="text-gray-900 dark:text-white font-bold text-5xl md:text-6xl xl:text-7xl leading-normal ">

                        <Typewriter
                            // onInit={(typewriter) => {
                            //     typewriter
                            //         .typeString('Simplify ')
                            //         .typeString('<span class="text-red-500">PDF</span> ')
                            //         .typeString('<span class="text-yellow-400">Note</span>-Taking <br/> with')
                            //         .typeString(' <span class="text-blue-500">AI</span>-Powered')
                            //         .start();
                            // }}
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
                    {/* buttons và rest of content
                    <div className="mt-16 flex flex-wrap justify-center gap-y-4 gap-x-6">
                        <a
                            href="/dashboard"
                            className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-primary before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max"
                        >
                            <span className="relative text-base font-semibold text-white"
                            >Get started</span
                            >
                        </a>

                    </div> */}



                    {/* Conditional Buttons */}
                    <div className="mt-16 flex flex-wrap justify-center gap-y-4 gap-x-6">
                        {!isLoaded ? (
                            // Loading state
                            <div className="h-11 w-32 bg-gray-200 animate-pulse rounded-full"></div>
                        ) : user ? (
                            // Đã login - hiện Get Started
                            <a
                                href="/dashboard"
                                className="relative flex h-11 w-full items-center justify-center px-6 before:absolute before:inset-0 before:rounded-full before:bg-primary before:transition before:duration-300 hover:before:scale-105 active:duration-75 active:before:scale-95 sm:w-max"
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



            {/* Wave Animation
            <div className="absolute bottom-0 left-0 w-full -mb-1 overflow-hidden">
                <svg width="100%" height="400" viewBox="0 0 1440 700" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="gradient" x1="1%" y1="40%" x2="99%" y2="60%">
                            <stop offset="5%" stopColor="#eb144c"></stop>
                            <stop offset="95%" stopColor="#8ed1fc"></stop>
                        </linearGradient>
                    </defs>
                    <path
                        fill="url(#gradient)"
                        fillOpacity="0.53"
                        style={{
                            animation: 'wave-animation-0 8s ease-in-out infinite'
                        }}
                    >
                        <animate
                            attributeName="d"
                            dur="8s"
                            repeatCount="indefinite"
                            values="M 0,700 L 0,175 C 37.127,207.068 74.254,239.135 120,255 C 165.746,270.865 220.111,270.527 266,232 C 311.889,193.473 349.304,116.755 392,102 C 434.696,87.245 482.674,134.451 529,154 C 575.326,173.549 620,165.441 658,180 C 696.001,194.559 727.328,231.785 767,219 C 806.672,206.215 854.688,143.42 897,128 C 939.312,112.58 975.919,144.537 1025,152 C 1074.081,159.463 1135.637,142.432 1180,164 C 1224.363,185.568 1251.532,245.734 1292,254 C 1332.468,262.266 1386.234,218.633 1440,175 L 1440,700 L 0,700 Z;
                        M 0,700 L 0,175 C 42.704,196.096 85.408,217.191 124,209 C 162.592,200.809 197.072,163.33 237,152 C 276.928,140.67 322.303,155.487 371,174 C 419.697,192.513 471.715,214.72 517,198 C 562.285,181.28 600.838,125.633 645,100 C 689.162,74.367 738.935,78.749 781,111 C 823.065,143.251 857.424,203.371 897,205 C 936.576,206.629 981.371,149.767 1034,128 C 1086.629,106.233 1147.092,119.563 1190,130 C 1232.908,140.437 1258.259,147.982 1297,155 C 1335.741,162.018 1387.87,168.509 1440,175 L 1440,700 L 0,700 Z;
                        M 0,700 L 0,175 C 42.222,186.533 84.445,198.066 135,210 C 185.555,221.934 244.443,234.269 282,232 C 319.557,229.731 335.783,212.858 379,203 C 422.217,193.142 492.425,190.298 542,161 C 591.575,131.702 620.517,75.95 661,88 C 701.483,100.05 753.508,179.903 797,191 C 840.492,202.097 875.452,144.438 921,148 C 966.548,151.562 1022.683,216.347 1068,252 C 1113.317,287.653 1147.816,294.176 1188,260 C 1228.184,225.824 1274.053,150.95 1317,130 C 1359.947,109.05 1399.974,142.025 1440,175 L 1440,700 L 0,700 Z;
                        M 0,700 L 0,175 C 47.538,175.12 95.076,175.24 143,177 C 190.924,178.76 239.235,182.159 281,195 C 322.765,207.841 357.984,230.124 393,202 C 428.016,173.876 462.83,95.346 506,105 C 549.17,114.654 600.696,212.492 641,214 C 681.304,215.508 710.386,120.685 761,102 C 811.614,83.316 883.758,140.77 934,176 C 984.242,211.23 1012.58,224.237 1049,215 C 1085.42,205.763 1129.921,174.282 1179,185 C 1228.079,195.718 1281.737,248.634 1326,254 C 1370.263,259.366 1405.132,217.183 1440,175 L 1440,700 L 0,700 Z;
                        M 0,700 L 0,175 C 37.127,207.068 74.254,239.135 120,255 C 165.746,270.865 220.111,270.527 266,232 C 311.889,193.473 349.304,116.755 392,102 C 434.696,87.245 482.674,134.451 529,154 C 575.326,173.549 620,165.441 658,180 C 696.001,194.559 727.328,231.785 767,219 C 806.672,206.215 854.688,143.42 897,128 C 939.312,112.58 975.919,144.537 1025,152 C 1074.081,159.463 1135.637,142.432 1180,164 C 1224.363,185.568 1251.532,245.734 1292,254 C 1332.468,262.266 1386.234,218.633 1440,175 L 1440,700 L 0,700 Z"
                        />
                    </path>
                    <path
                        fill="url(#gradient)"
                        fillOpacity="1"
                        style={{
                            animation: 'wave-animation-1 8s ease-in-out infinite'
                        }}
                    >
                        <animate
                            attributeName="d"
                            dur="8s"
                            repeatCount="indefinite"
                            values="M 0,700 L 0,408 C 34.664,441.498 69.328,474.997 121,482 C 172.672,489.003 241.352,469.511 283,448 C 324.648,426.489 339.263,402.959 375,393 C 410.737,383.041 467.597,386.653 520,387 C 572.403,387.347 620.35,384.43 663,389 C 705.65,393.57 743.002,405.626 782,419 C 820.998,432.374 861.643,447.067 901,469 C 940.357,490.933 978.426,520.106 1030,480 C 1081.574,439.894 1146.655,330.51 1191,321 C 1235.345,311.49 1258.956,401.854 1297,433 C 1335.044,464.146 1387.522,436.073 1440,408 L 1440,700 L 0,700 Z;
                        M 0,700 L 0,408 C 36.207,390.009 72.414,372.017 117,378 C 161.586,383.983 214.55,413.94 265,422 C 315.45,430.06 363.387,416.222 410,434 C 456.613,451.778 501.902,501.171 547,483 C 592.098,464.829 637.005,379.095 668,350 C 698.995,320.905 716.077,348.45 763,372 C 809.923,395.55 886.687,415.106 938,440 C 989.313,464.894 1015.177,495.126 1057,469 C 1098.823,442.874 1156.606,360.389 1199,325 C 1241.394,289.611 1268.398,301.317 1306,323 C 1343.602,344.683 1391.801,376.341 1440,408 L 1440,700 L 0,700 Z;
                        M 0,700 L 0,408 C 52.424,428.162 104.848,448.325 146,460 C 187.152,471.675 217.031,474.863 260,474 C 302.969,473.137 359.029,468.224 409,453 C 458.971,437.776 502.852,412.24 535,424 C 567.148,435.76 587.562,484.817 631,476 C 674.438,467.183 740.901,400.493 787,362 C 833.099,323.507 858.836,313.21 899,330 C 939.164,346.79 993.755,390.665 1037,419 C 1080.245,447.335 1112.143,460.129 1161,468 C 1209.857,475.871 1275.673,478.82 1325,468 C 1374.327,457.18 1407.163,432.59 1440,408 L 1440,700 L 0,700 Z;
                        M 0,700 L 0,408 C 31.105,453.868 62.209,499.736 114,485 C 165.791,470.264 238.267,394.923 282,372 C 325.733,349.077 340.722,378.57 377,389 C 413.278,399.43 470.846,390.795 522,380 C 573.154,369.205 617.894,356.25 654,341 C 690.106,325.75 717.577,308.205 761,331 C 804.423,353.795 863.798,416.928 919,423 C 974.202,429.072 1025.229,378.081 1062,356 C 1098.771,333.919 1121.284,340.747 1165,335 C 1208.716,329.253 1273.633,310.929 1323,321 C 1372.367,331.071 1406.183,369.535 1440,408 L 1440,700 L 0,700 Z;
                        M 0,700 L 0,408 C 34.664,441.498 69.328,474.997 121,482 C 172.672,489.003 241.352,469.511 283,448 C 324.648,426.489 339.263,402.959 375,393 C 410.737,383.041 467.597,386.653 520,387 C 572.403,387.347 620.35,384.43 663,389 C 705.65,393.57 743.002,405.626 782,419 C 820.998,432.374 861.643,447.067 901,469 C 940.357,490.933 978.426,520.106 1030,480 C 1081.574,439.894 1146.655,330.51 1191,321 C 1235.345,311.49 1258.956,401.854 1297,433 C 1335.044,464.146 1387.522,436.073 1440,408 L 1440,700 L 0,700 Z"
                        />
                    </path>
                </svg>
            </div> */}
        </div>

    )
}



export default Hero