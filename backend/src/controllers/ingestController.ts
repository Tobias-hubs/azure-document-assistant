import { Request, Response } from "express";
import { DocumentIngestService } from "../services/documentIngestService";
import { randomUUID } from "crypto"; 

export class IngestController { 
    constructor(private ingestService: DocumentIngestService) {}

    ingest = async (req: Request, res: Response) => { 
        try { 
            const file = req.file; 

            if (!file) { 
                return res.status(400).json({ error: "No PDF uploaded" }); 
            }

            const docId = randomUUID();

            await this.ingestService.ingestBuffer(file.buffer, docId); 

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