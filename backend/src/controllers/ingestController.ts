import { Request, Response } from "express";
import { randomUUID } from "crypto"; 
import { HostedIngestService } from "../services/HostedIngestService";

export class IngestController { 
    // Dependency Injection
    constructor(private ingestService: HostedIngestService) {}

    // Handler method for POST /api/ingest
    ingest = async (req: Request, res: Response) => { 
        try { 
            const file = req.file; // PDF-buffer 

            if (!file) { 
                return res.status(400).json({ error: "No PDF uploaded" }); 
            }

            const docId = randomUUID(); // Generate Unique ID

            await this.ingestService.uploadFile(file.buffer, file.originalname, docId); // (buffer = binary)  

            res.json({ 
                status: "ok",
                docId, 
                displayName: file.originalname,
            });
        } catch (err) { 
            console.error(err); 
            res.status(500).json({ error: "PDF ingest failed"}); 
        }
    };
}