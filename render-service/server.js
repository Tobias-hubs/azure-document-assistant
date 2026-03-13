import express from "express";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
const exec = promisify(execFile);

const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/render", async (req, res) => {
    try { 
        const { pdfPath, page } = req.body;
        if (!pdfPath || !page || page < 1) {
            return res.status(400).json({ error: "Missing or invalid pdfPath or page number" });
         
        }
        
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "render-"));
    const pdfPath = path.join(tmpDir, "input.pdf");
    const outPath = path.join(tmpDir, "page");

    try { 
        await fs.writeFile(pdfPath, Buffer.from(pdfBase64, "base64"));

        await exec("pdftoppm", [
            "-png",
            "-f", page.toString(),
            "-l", page.toString(),
            pdfPath,
            outPath
       ]); 

       const img = await fs.readFile(`${outPath}-${page}.png`);
       res.json({ imageBase64: img.toString("base64") });
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
    } catch (err) {
        res.status(500).json({ error: "Failed to render page", details: err.toString() });
 
    }
});

app.get("/health", (req, res) => res.json({ ok: true }));
app.listen(7070, () => console.log("Render service running on :7070"));