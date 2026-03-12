
import * as os from "os";
import * as path from "path";
import { promises as fs } from "fs";
import OpenAI from "openai";

const pdf2img = require("pdf-img-extractor");

export async function extractOnePageImageBase64( 
    client: OpenAI, 
    fileId: string, 
    page: number 
): Promise<string | null> {

    const fileContent = await client.files.content(fileId);
    const arrayBuffer = await fileContent.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf-extract-"));
    const pdfPath = path.join(tmpDir, "input.pdf");

    try { 
        await fs.writeFile(pdfPath, buffer);

        const pages = await pdf2img(pdfPath); 
        const match = pages.find((p: any) => p.page === page);

        if (!match) return null; 

        const imgBuffer = await fs.readFile(match.path);
        return imgBuffer.toString("base64");
        } finally {
            try { 
                await fs.rm(tmpDir, { recursive: true, force: true });
            } catch (err) { 
                console.warn("Failed to clean up temp files:", err);
            }
    }

}