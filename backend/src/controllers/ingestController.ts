import { Request, Response } from "express";
import { DocumentIngestService } from "../services/documentIngestService";
import { randomUUID } from "crypto"; 

export class IngestController { 
    // Dependency Injection
    constructor(private ingestService: DocumentIngestService) {}

    // Handler method for POST /api/ingest
    ingest = async (req: Request, res: Response) => { 
        try { 
            const file = req.file; // PDF-buffer 

            if (!file) { 
                return res.status(400).json({ error: "No PDF uploaded" }); 
            }

            const docId = randomUUID(); // Generate Unique ID

// INGEST 4 - Controller receives req.file and forwards the PDF buffer
            await this.ingestService.ingestBuffer(file.buffer, docId); // (buffer = binary)

            res.json({ 
                status: "ok",
                docId, 
                chunksIngested: true, 
                displayName: file.originalname,
            });
        } catch (err) { 
            console.error(err); 
            res.status(500).json({ error: "PDF ingest failed"}); 
        }
    };
}