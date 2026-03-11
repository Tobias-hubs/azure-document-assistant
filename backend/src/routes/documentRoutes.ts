import express, { Request, Response } from "express";
import OpenAI, { toFile } from "openai";
import { upload } from "../middleware/upload";

export function createDocumentRoutes(openAi: OpenAI, vectorStoreId: string) {
    const router = express.Router();

// GET /api/documents - List all documents in the vector store
    router.get("/documents", async (_req: Request, res: Response) => {
        try { 
            const page = await openAi.vectorStores.files.list(vectorStoreId);

            const documents = page.data.map((file: any) => ({
                fileId: file.file_id ?? file.file_ids?.[0] ?? null, // Handle both single and multiple file_id formats
                vectorStoreFileId: file.id, 
                filename: file.attributes?.filename ?? file.file_id ?? file.file_ids?.[0], 
                uploadedAt: file.attributes?.uploadedAt ?? null,
            }));

            return res.json(documents); 

        } catch (err) {
            console.error("Failed to list documents:", err);
            return res.status(500).json({ error: "Failed to list documents" });
        }
    });


    // POST /api/documents/replace - Replace a document (delete old, upload new)
    
    router.post("/documents/replace", upload.single("file"), async (req: Request, res: Response) => {
        try { 
            const { filename } = req.body;
            const file = req.file; 
            
            if (!filename || !file) { 
                return res.status(400).json({ error: "filename or file missing" });
            }

            // List files 
            const list = await openAi.vectorStores.files.list(vectorStoreId);

            // Find matching file by filename (or other metadata)
            const match: any = list.data.find(
                (file: any) => file.attributes?.filename === filename 
            );

            if (match) { 
                // Delete existing file from vector store
                await openAi.vectorStores.files.delete(vectorStoreId, match.id);
                // Optionally delete from OpenAI Files as well if you want to fully clean up
                await openAi.files.delete(match.file_id);
            }

            const uploaded = await openAi.files.create({ 
                file: await toFile(file.buffer, filename, { type: file.mimetype}), 
                purpose: "assistants"
            });

            const vsFile = await openAi.vectorStores.files.create(
                vectorStoreId, 
                { 
                    file_id: uploaded.id,
                    attributes: { 
                        filename, 
                        uploadedAt: new Date().toISOString(),
                    }
                }
            );

            return res.json({
                status: "replaced",
                fileId: uploaded.id,
                vectorStoreFileId: vsFile.id,
            });

        } catch (err) { 
            console.error("Failed to replace document:", err);
            return res.status(500).json({ error: "Failed to replace document" });
        }
    });

    return router; 
}