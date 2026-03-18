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
        // Render one page to PNG using pdftoppm (in poppler)
        await execFileAsync("pdftoppm", [
            "-png", 
            "-f", 
            String(page),
            "-l",
            String(page),
            tempPdfPath,
            tempOutPrefix
        ]); 

        const files = await fs.readdir(tempDir);
        console.log("[POPPLER] Files after rendering: ", files);

        const candidates = files.filter(f => f.startsWith(`${uuid}-page`) && (f.endsWith(".png") || f.endsWith(".ppm"))
    )
    .sort(); 
    if (candidates.length === 0) { 
        throw new Error("Poppler did not produce any PNG/PPM file.");
    }

    const file = candidates[0]!;
    const finalPath = path.join(tempDir, file);
    const pngBuffer = await fs.readFile(finalPath);

    return pngBuffer.toString("base64");
} finally { 
    try { await fs.rm(tempPdfPath, { force: true}); } catch {}
    try { 
        const files = await fs.readdir(tempDir);
        await Promise.all( 
            files 
            .filter(f => f.startsWith(`${uuid}-page-`))
            .map(f => fs.rm(path.join(tempDir, f), { force: true }))
        );
    } catch {}
}
}