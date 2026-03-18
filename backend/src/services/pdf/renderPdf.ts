import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

export async function renderPdf(buffer: Buffer, page: number): Promise<string> {
    if (!page || page < 1) page = 1; 

    const tempDir = path.join(process.cwd(), "temp_pdf_render"); 
    await fs.mkdir(tempDir, { recursive: true });

    const uuid = randomUUID(); 
    const tempPdfPath = path.join(tempDir, `${uuid}.pdf`);
    const tempOutPrefix = path.join(tempDir, `${uuid}-page`);

    await fs.writeFile(tempPdfPath, buffer);

    try {
        await execFileAsync("pdftoppm", [
            "-png", 
            "-f", 
            String(page),
            "-l",
            String(page),
            tempPdfPath,
            tempOutPrefix
        ]); 

        const pngPath = `${tempOutPrefix}-1.png`;
        const pngBuffer = await fs.readFile(pngPath);

        return pngBuffer.toString("base64");
        
    } finally { 
        // Cleanup
        console.log("[POPPLER] Files created: ", await fs.readdir(tempDir));
        try { await fs.rm(tempPdfPath, { force: true}); } catch {}
        try { await fs.rm(`${tempOutPrefix}-1.png`, { force: true }); } catch {}
    }
}