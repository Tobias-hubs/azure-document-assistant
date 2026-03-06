/*
import { PDFDocument } from "pdf-lib";

export class ImageExtractor { 
    async extractImages(buffer: Buffer) {
        const images: { page: number; base64: string }[] = [];

        // Load PDF 
        const pdf = await PDFDocument.load(buffer);
        const pages = pdf.getPages();

        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            const page = pages[pageIndex];

            const xObjects = pages.node.Resources()?.XObjects();
            if (!xObjects) continue;

            for (const key of xObjects.keys()) {
                const xObject = xObjects.get(key);

                if (xObject?.contents) { 
                    const base64 = Buffer.from(xObject.contents).toString("base64");

                    images.push({ 
                        page: pageIndex + 1, 
                        base64,
                    });
                }
            }
        }

        return images; 
    }
}  */ 