import { Request, Response } from "express";
import { randomUUID } from "crypto"; 
import { HostedIngestService } from "../services/HostedIngestService";
import { documentRepository } from "../repositories/documentRepository";

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

            const result = await this.ingestService.uploadFile(
                file.buffer,
                file.originalname,
                docId); // (buffer = binary)  

                // Save in SQLite
                documentRepository.create( 
                    docId, 
                    result.fileId, 
                    process.env.OPENAI_VECTOR_STORE_ID!,
                    file.originalname
                ); 

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

    delete = async(req: Request, res: Response) => { 
        try { 
            const docIdParam  = req.params.docId;
            if(!docIdParam) { 
                return res.status(400).json({ error: "Missing docId"}); 
            } 

            const docId = Array.isArray(docIdParam) ? docIdParam[0] : docIdParam;

            const record = documentRepository.findById(docId!); 

            if (!record || !record.file_id) { 
                return res.status(404).json({ error: "Document not found"}); 

            }

            await this.ingestService.deleteFile(record.file_id); 

            documentRepository.delete(docId!); 

            res.json({ status: "deleted" }); 
        } catch (err) { 
            console.error(err); 
            res.status(500).json({ error: "Delete failed" }); 
            }
        }; 
    }
