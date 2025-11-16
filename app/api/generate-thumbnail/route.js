import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(req) {
    try {
        const { pdfUrl } = await req.json();

        // Fetch PDF
        const pdfResponse = await fetch(pdfUrl);
        const pdfBuffer = await pdfResponse.arrayBuffer();

        // Load PDF
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // Extract first page
        const newPdfDoc = await PDFDocument.create();
        const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
        newPdfDoc.addPage(firstPage);

        // Convert to buffer
        const thumbnailBytes = await newPdfDoc.save();

        // Convert to base64 data URL
        const base64 = Buffer.from(thumbnailBytes).toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64}`;

        return NextResponse.json({ thumbnailData: dataUrl });

    } catch (error) {
        console.error('Thumbnail generation error:', error);
        return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 });
    }
}