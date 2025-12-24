// 'use client'
// import React from 'react'
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
//     DialogFooter,
//     DialogClose,
// } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Button } from '@/components/ui/button'
// import { useAction, useMutation } from 'convex/react'
// import { useState } from 'react'
// import { api } from '@/convex/_generated/api'
// import { Loader2Icon, CircleCheckIcon } from 'lucide-react'
// import { v4 as uuid4 } from 'uuid';
// import { useUser } from '@clerk/nextjs'
// import axios from 'axios'
// import { toast } from 'sonner'


// const UploadPDF = ({ children, isMaxFile }) => {

//     const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl)
//     const addFileEntry = useMutation(api.fileStorage.AddFileEntryToDb)
//     const getFileUrl = useMutation(api.fileStorage.getFileUrl)
//     const embededDocument = useAction(api.myAction.ingest)
//     const { user } = useUser()
//     const [file, setFile] = useState()
//     const [loading, setLoading] = useState(false)
//     const [fileName, setFileName] = useState('')
//     const [open, setOpen] = useState(false)
//     const [includeImages, setIncludeImages] = useState(false)
//     const ingestWithImages = useAction(api.ingest.ingestPdfWithImages)

//     // Function để truncate tên file dài
//     const truncateFileName = (name, maxLength = 60) => {
//         if (name.length <= maxLength) return name
//         const start = name.substring(0, 12)
//         const end = name.substring(name.length - 12)
//         return `${start}...${end}`
//     }

//     const OnFileSelect = (event) => {
//         const selectedFile = event.target.files[0]
//         setFile(selectedFile)
//         // Tự động set tên file mặc định (bỏ extension .pdf)
//         if (selectedFile) {
//             const defaultName = selectedFile.name.replace('.pdf', '')
//             setFileName(defaultName)
//         }
//     }

//     const OnUpload = async () => {
//         setLoading(true)

//         if (!file) {
//             setLoading(false)
//             toast.error('Please select pdf')
//             return;
//         }

//         try {
//             // 1. Upload file lên storage
//             const postUrl = await generateUploadUrl();
//             const result = await fetch(postUrl, {
//                 method: "POST",
//                 headers: { "Content-Type": file?.type },
//                 body: file,
//             });
//             const { storageId } = await result.json()
//             const fileId = uuid4()
//             const fileUrl = await getFileUrl({ storageId: storageId })
//             const finalFileName = fileName.trim() || file.name.replace('.pdf', '')

//             // 2. Generate thumbnail
//             let thumbnailStorageId = null;
//             let thumbnailUrl = null;

//             try {
//                 const thumbResponse = await axios.post('/api/generate-thumbnail', { pdfUrl: fileUrl });

//                 if (thumbResponse.data.thumbnailData) {
//                     // Convert base64 to blob
//                     const base64Data = thumbResponse.data.thumbnailData.split(',')[1];
//                     const binaryData = atob(base64Data);
//                     const uint8Array = new Uint8Array(binaryData.length);
//                     for (let i = 0; i < binaryData.length; i++) {
//                         uint8Array[i] = binaryData.charCodeAt(i);
//                     }
//                     const blob = new Blob([uint8Array], { type: 'application/pdf' });

//                     // Upload thumbnail
//                     const thumbPostUrl = await generateUploadUrl();
//                     const thumbResult = await fetch(thumbPostUrl, {
//                         method: "POST",
//                         headers: { "Content-Type": 'application/pdf' },
//                         body: blob,
//                     });
//                     const thumbData = await thumbResult.json();
//                     thumbnailStorageId = thumbData.storageId;
//                     thumbnailUrl = await getFileUrl({ storageId: thumbnailStorageId });
//                 }
//             } catch (thumbError) {
//                 console.error('Thumbnail generation failed:', thumbError);
//                 // Continue without thumbnail
//             }

//             // 3. Save file entry với thumbnail
//             await addFileEntry({
//                 filedId: fileId,
//                 storageId: storageId,
//                 fileName: finalFileName,
//                 fileUrl: fileUrl,
//                 thumbnailStorageId: thumbnailStorageId,
//                 thumbnailUrl: thumbnailUrl,
//                 createdBy: user?.primaryEmailAddress?.emailAddress
//             })

//             // 4. Process PDF chunks
//             if (includeImages) {
//                 // Dùng Gemini Multimodal
//                 console.log('Using Gemini Multimodal approach...');
//                 await ingestWithImages({
//                     pdfUrl: fileUrl,
//                     fileId: fileId
//                 });
//             } else {
//                 // Dùng cách cũ (chỉ text)
//                 console.log('Using text-only approach...');
//                 const ApiResp = await axios.get('/api/pdf-loader?pdfUrl=' + encodeURIComponent(fileUrl))
//                 await embededDocument({
//                     splitText: ApiResp.data.result,
//                     fileId: fileId,
//                     metadata: ApiResp.data.metadata
//                 })
//             }


//             setLoading(false)
//             setOpen(false)
//             setFileName('')
//             setFile(null)

//             toast.success('File is ready', {
//                 icon: <CircleCheckIcon size={16} className="text-emerald-600" />
//             })
//         } catch (error) {
//             console.error('Upload error:', error)
//             toast.error('Upload failed')
//             setLoading(false)
//         }
//     }

//     return (
//         <Dialog open={open} onOpenChange={setOpen}>
//             <DialogTrigger asChild>
//                 <Button onClick={() => setOpen(true)} disabled={isMaxFile} className='w-full hover:scale-105 transition-all duration-200'>+ Upload PDF</Button>
//             </DialogTrigger>
//             <DialogContent>
//                 <DialogHeader>
//                     <DialogTitle>Upload PDF File</DialogTitle>
//                     <DialogDescription asChild>
//                         <div className=''>


//                             {/* Box tick */}
//                             <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
//                                 <label className='flex items-start space-x-3 cursor-pointer'>
//                                     <input
//                                         type="checkbox"
//                                         checked={includeImages}
//                                         onChange={(e) => setIncludeImages(e.target.checked)}
//                                         className='mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
//                                     />
//                                     <div className='flex-1'>
//                                         <span className='text-sm font-semibold text-gray-800 block'>
//                                             Image Analysis in PDF (AI Vision)
//                                         </span>
//                                         <p className='text-xs text-gray-600 mt-1'>

//                                             <span className='font-medium'> Takes another 30-60 seconds</span>
//                                         </p>

//                                     </div>
//                                 </label>
//                             </div>



//                             <h2 className='mt-5'>Select a file to upload</h2>
//                             <div className='gap-2 p-3 rounded-md border'>
//                                 <input
//                                     type="file"
//                                     accept='application/pdf'
//                                     className="
//                                         block  text-sm text-slate-500 
//                                         file:mr-4 file:py-2 file:px-4

//                                         file:rounded-lg file:border
//                                         file:border-gray-500 file:text-sm file:font-semibold
//                                         file:bg-gray-100 file:text-gray-700

//                                     "
//                                     onChange={(event) => OnFileSelect(event)}
//                                 />
//                             </div>
//                             <div className='mt-2'>
//                                 <label className='text-sm text-gray-600'>
//                                     File Name <span className='text-gray-500'>(optional)</span>
//                                 </label>
//                                 <Input
//                                     placeholder='Enter custom name or use default'
//                                     value={fileName}
//                                     onChange={(event) => setFileName(event.target.value)}
//                                 />
//                             </div>

//                         </div>
//                     </DialogDescription>
//                 </DialogHeader>
//                 <DialogFooter className="sm:justify-end">
//                     <DialogClose asChild>
//                         <Button className='hover:bg-slate-200 hover:scale-105 transition-all duration-200' type="button" variant="secondary" onClick={() => {
//                             setFile(null)
//                             setFileName('')
//                             setOpen(false)
//                         }}>
//                             Close
//                         </Button>
//                     </DialogClose>
//                     <Button onClick={OnUpload} disabled={loading}>{loading ? <Loader2Icon className='animate-spin' /> : 'Upload'}</Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     )
// }

// export default UploadPDF

'use client'
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import { useAction, useMutation } from 'convex/react'
import { useState, useEffect, useRef } from 'react'
import { api } from '@/convex/_generated/api'
import { Loader2Icon, CircleCheckIcon, Terminal } from 'lucide-react'
import { v4 as uuid4 } from 'uuid';
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { toast } from 'sonner'


const UploadPDF = ({ children, isMaxFile }) => {

    const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl)
    const addFileEntry = useMutation(api.fileStorage.AddFileEntryToDb)
    const getFileUrl = useMutation(api.fileStorage.getFileUrl)
    const embededDocument = useAction(api.myAction.ingest)
    const { user } = useUser()
    const [file, setFile] = useState()
    const [loading, setLoading] = useState(false)
    const [fileName, setFileName] = useState('')
    const [open, setOpen] = useState(false)
    const [includeImages, setIncludeImages] = useState(true)
    const ingestWithImages = useAction(api.ingest.ingestPdfWithImages)

    // ========== THÊM STATES CHO LOADING EFFECT ==========
    const [progress, setProgress] = useState(0)
    const [logs, setLogs] = useState([])
    const logsEndRef = useRef(null)

    // ========== DANH SÁCH LOG MESSAGES ==========
    const logMessages = [
        { text: "🚀 Initializing upload system...", delay: 500 },
        { text: "📄 Reading PDF file structure...", delay: 1000 },
        { text: "🔍 Analyzing document metadata...", delay: 1500 },
        { text: "📊 Scanning pages 1-5...", delay: 2000 },
        { text: "📊 Scanning pages 6-10...", delay: 2500 },
        { text: "🎨 Generating thumbnail preview...", delay: 3000 },
        { text: "💾 Uploading to secure storage...", delay: 3500 },
        { text: "✅ File uploaded successfully!", delay: 4000 },
        { text: "🤖 Activating AI Vision system...", delay: 4500 },
        { text: "🧠 Loading language model...", delay: 5000 },
        { text: "📖 Extracting text content...", delay: 5500 },
        { text: "🔤 Processing page 1...", delay: 6000 },
        { text: "🔤 Processing page 2...", delay: 6500 },
        { text: "🔤 Processing page 3...", delay: 7000 },
        { text: "🖼️ Detecting images and diagrams...", delay: 7500 },
        { text: "📐 Analyzing visual elements...", delay: 8000 },
        { text: "🎯 Identifying key concepts...", delay: 8500 },
        { text: "🔗 Building semantic connections...", delay: 9000 },
        { text: "📊 Creating vector embeddings...", delay: 9500 },
        { text: "🗂️ Organizing data structure...", delay: 10000 },
        { text: "🔐 Encrypting sensitive information...", delay: 10500 },
        { text: "⚡ Optimizing search index...", delay: 11000 },
        { text: "🎨 Enhancing color mappings...", delay: 11500 },
        { text: "📝 Preparing document metadata...", delay: 12000 },
        { text: "🧩 Linking cross-references...", delay: 12500 },
        { text: "☕ Making coffee for AI... (just kidding!)", delay: 13000 },
        { text: "🎓 Teaching AI about your document...", delay: 13500 },
        { text: "💫 Applying machine learning magic...", delay: 14000 },
        { text: "🔮 Predicting potential questions...", delay: 14500 },
        { text: "📚 Building knowledge graph...", delay: 15500 },
        { text: "🌟 Almost there, hang tight...", delay: 16000 },
        { text: "🔄 Running final optimizations...", delay: 16500 },
        { text: "✨ Polishing the experience...", delay: 17000 },
        { text: "🎉 Nearly ready to go...", delay: 17500 },
        { text: "🚀 Preparing to launch...", delay: 18000 },
    ]

    // ========== AUTO SCROLL LOGS ==========
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [logs])

    // ========== RESET KHI ĐÓNG DIALOG ==========
    useEffect(() => {
        if (!open) {
            setProgress(0)
            setLogs([])
        }
    }, [open])

    // ========== OPTIMISTIC PROGRESS BAR ==========
    useEffect(() => {
        if (!loading) return

        const startTime = Date.now()
        const estimatedTotalTime = includeImages ? 90000 : 60000 // 90s với images, 60s không

        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const ratio = elapsed / estimatedTotalTime

            let newProgress
            if (ratio < 0.2) {
                // 0-10s: Chạy nhanh lên 30%
                newProgress = (ratio / 0.2) * 30
            } else if (ratio < 0.7) {
                // 10-40s: Nhích từ từ lên 70%
                newProgress = 30 + ((ratio - 0.2) / 0.5) * 40
            } else if (ratio < 0.95) {
                // 40-60s: Nhích siêu chậm lên 95%
                newProgress = 70 + ((ratio - 0.7) / 0.25) * 25
            } else {
                // Stuck ở 95-98% cho đến khi thật sự xong
                newProgress = 95 + ((ratio - 0.95) / 0.05) * 3
                newProgress = Math.min(newProgress, 98)
            }

            setProgress(Math.min(newProgress, 98))
        }, 100)

        return () => clearInterval(progressInterval)
    }, [loading, includeImages])

    // ========== HACKER LOGS SIMULATION ==========
    useEffect(() => {
        if (!loading) return

        let logIndex = 0
        const startTime = Date.now()

        const logInterval = setInterval(() => {
            if (logIndex < logMessages.length) {
                const elapsed = Date.now() - startTime

                // // Add logs based on time or sequence
                // if (elapsed > logMessages[logIndex].delay || logIndex === 0) {
                //     setLogs(prev => [...prev, {
                //         id: Date.now() + Math.random(),
                //         text: logMessages[logIndex].text,
                //         timestamp: new Date().toLocaleTimeString()
                //     }])
                //     logIndex++
                // }
                // Add logs based on time or sequence
                const currentLog = logMessages[logIndex]
                if (currentLog && (elapsed > currentLog.delay || logIndex === 0)) {
                    setLogs(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        text: currentLog.text,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                    logIndex++
                }
            } else {
                // Repeat some messages randomly after finishing
                const randomMsg = logMessages[Math.floor(Math.random() * logMessages.length)]
                if (randomMsg && randomMsg.text) {
                    setLogs(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        text: randomMsg.text,
                        timestamp: new Date().toLocaleTimeString()
                    }])
                }
            }

        }, 2000) // Thêm log mới mỗi 2 giây

        return () => clearInterval(logInterval)
    }, [loading])

    // Function để truncate tên file dài
    const truncateFileName = (name, maxLength = 60) => {
        if (name.length <= maxLength) return name
        const start = name.substring(0, 12)
        const end = name.substring(name.length - 12)
        return `${start}...${end}`
    }

    const OnFileSelect = (event) => {
        const selectedFile = event.target.files[0]
        setFile(selectedFile)
        if (selectedFile) {
            const defaultName = selectedFile.name.replace('.pdf', '')
            setFileName(defaultName)
        }
    }

    const OnUpload = async () => {
        setLoading(true)
        setProgress(0)
        setLogs([])

        if (!file) {
            setLoading(false)
            toast.error('Please select pdf')
            return;
        }

        try {
            // 1. Upload file lên storage
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file?.type },
                body: file,
            });
            const { storageId } = await result.json()
            const fileId = uuid4()
            const fileUrl = await getFileUrl({ storageId: storageId })
            const finalFileName = fileName.trim() || file.name.replace('.pdf', '')

            // 2. Generate thumbnail
            let thumbnailStorageId = null;
            let thumbnailUrl = null;

            try {
                const thumbResponse = await axios.post('/api/generate-thumbnail', { pdfUrl: fileUrl });

                if (thumbResponse.data.thumbnailData) {
                    const base64Data = thumbResponse.data.thumbnailData.split(',')[1];
                    const binaryData = atob(base64Data);
                    const uint8Array = new Uint8Array(binaryData.length);
                    for (let i = 0; i < binaryData.length; i++) {
                        uint8Array[i] = binaryData.charCodeAt(i);
                    }
                    const blob = new Blob([uint8Array], { type: 'application/pdf' });

                    const thumbPostUrl = await generateUploadUrl();
                    const thumbResult = await fetch(thumbPostUrl, {
                        method: "POST",
                        headers: { "Content-Type": 'application/pdf' },
                        body: blob,
                    });
                    const thumbData = await thumbResult.json();
                    thumbnailStorageId = thumbData.storageId;
                    thumbnailUrl = await getFileUrl({ storageId: thumbnailStorageId });
                }
            } catch (thumbError) {
                console.error('Thumbnail generation failed:', thumbError);
            }

            // 3. Save file entry với thumbnail
            await addFileEntry({
                filedId: fileId,
                storageId: storageId,
                fileName: finalFileName,
                fileUrl: fileUrl,
                thumbnailStorageId: thumbnailStorageId,
                thumbnailUrl: thumbnailUrl,
                createdBy: user?.primaryEmailAddress?.emailAddress
            })

            // 4. Process PDF chunks

            console.log('Using Gemini Multimodal approach...');
            await ingestWithImages({
                pdfUrl: fileUrl,
                fileId: fileId
            });


            // ========== KHI XONG: JUMP LÊN 100% ==========
            setProgress(100)
            setLogs(prev => [...prev, {
                id: Date.now(),
                text: "✅ All done! Your document is ready to use! 🎉",
                timestamp: new Date().toLocaleTimeString()
            }])

            // Đợi 1 giây để user thấy 100%
            setTimeout(() => {
                setLoading(false)
                setOpen(false)
                setFileName('')
                setFile(null)
                setProgress(0)
                setLogs([])

                toast.success('File is ready', {
                    icon: <CircleCheckIcon size={16} className="text-emerald-600" />
                })
            }, 1000)

        } catch (error) {
            console.error('Upload error:', error)
            setProgress(0)
            setLogs(prev => [...prev, {
                id: Date.now(),
                text: "❌ Error occurred during processing",
                timestamp: new Date().toLocaleTimeString()
            }])
            toast.error('Upload failed')
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setOpen(true)} disabled={isMaxFile} className='w-full hover:scale-105 transition-all duration-200'>+ Upload PDF</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Upload PDF File</DialogTitle>
                    <DialogDescription asChild>
                        <div className=''>
                            {/* ========== LOADING SCREEN ========== */}
                            {loading ? (
                                <div className="space-y-4 py-4">
                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-700">
                                                Processing...
                                            </span>
                                            <span className="text-sm font-bold text-blue-600">
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-700  to-orange-400 h-full rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Hacker Logs Terminal */}
                                    <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                                            <Terminal className="w-4 h-4 text-green-400" />
                                            <span className="text-green-400 font-semibold">SYSTEM LOG</span>
                                        </div>
                                        <div className="space-y-1">
                                            {logs.map((log) => (
                                                <div key={log.id} className="text-green-400 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                                                    <span>{log.text}</span>
                                                </div>
                                            ))}
                                            <div ref={logsEndRef} />
                                        </div>
                                        {/* Blinking Cursor */}
                                        <div className="inline-block w-2 h-4 bg-green-400 animate-pulse mt-1"></div>
                                    </div>

                                    {/* Estimated Time */}
                                    <p className="text-xs text-gray-500 text-center">
                                        ⏱️ Estimated time: 2-3 minutes | Hang tight, we're working hard! 💪
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* ========== UPLOAD FORM ========== */}
                                    {/* Box tick */}
                                    {/* <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                                        {/* <label className='flex items-start space-x-3 cursor-pointer'>
                                            <input
                                                type="checkbox"
                                                checked={includeImages}
                                                onChange={(e) => setIncludeImages(e.target.checked)}
                                                className='mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
                                            />
                                            <div className='flex-1'>
                                                <span className='text-sm font-semibold text-gray-800 block'>
                                                    Image Analysis in PDF (AI Vision)
                                                </span>
                                                <p className='text-xs text-gray-600 mt-1'>
                                                    <span className='font-medium'> Takes another 30-60 seconds</span>
                                                </p>
                                            </div>
                                        </label> */}
                                    {/* </div> */}

                                    <h2 className='mt-5'>Select a file to upload</h2>
                                    <div className='gap-2 p-3 rounded-md border'>
                                        <input
                                            type="file"
                                            accept='application/pdf'
                                            className="
                                                block  text-sm text-slate-500 
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-lg file:border
                                                file:border-gray-500 file:text-sm file:font-semibold
                                                file:bg-gray-100 file:text-gray-700
                                            "
                                            onChange={(event) => OnFileSelect(event)}
                                        />
                                    </div>
                                    <div className='mt-2'>
                                        <label className='text-sm text-gray-600'>
                                            File Name <span className='text-gray-500'>(optional)</span>
                                        </label>
                                        <Input
                                            placeholder='Enter custom name or use default'
                                            value={fileName}
                                            onChange={(event) => setFileName(event.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                {!loading && (
                    <DialogFooter className="sm:justify-end">
                        <DialogClose asChild>
                            <Button className='hover:bg-slate-200 hover:scale-105 transition-all duration-200' type="button" variant="secondary" onClick={() => {
                                setFile(null)
                                setFileName('')
                                setOpen(false)
                            }}>
                                Close
                            </Button>
                        </DialogClose>
                        <Button onClick={OnUpload} disabled={loading}>Upload</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default UploadPDF