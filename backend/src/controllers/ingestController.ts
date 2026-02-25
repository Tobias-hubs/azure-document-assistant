import { Request, Response } from "express";
import { randomUUID } from "crypto"; 
import { HostedIngestService } from "../services/HostedIngestService";
import { documentRepository } from "../repositories/documentRepository";
import crypto from "crypto";

export class IngestController { 
    // Dependency Injection
    constructor(private ingestService: HostedIngestService) {}

    // Handler method for POST /api/ingest
    ingest = async (req: Request, res: Response) => { 
        try { 
            const file = req.file; // PDF-buffer ( From multer)

            if (!file) { 
                return res.status(400).json({ error: "No PDF uploaded" }); 
            }

            // Compute content hash for deduplication
            const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");

            // Check for existing document with same content hash
            const existing = documentRepository.findByHash(hash);
            if (existing) { 
                // TODO display in frontend? 
                return res.status(409).json({ 
                    error: "duplicate",
                    message: "Document with same content already exists",
                    docId: existing.id,
                    displayName: existing.filename,
                }); 
            }

            const docId = randomUUID(); // NOTE Generate Unique ID (Separate from openai fileId)

            const result = await this.ingestService.uploadFile(
                file.buffer,
                file.originalname,
                docId); // (buffer = binary)  

                // Save metadata in SQLite (local)
                documentRepository.create( 
                    docId, 
                    result.fileId, // OpenAI file ID
                    process.env.OPENAI_VECTOR_STORE_ID!,
                    file.originalname, 
                    result.vectorStoreFileId,
                    hash 
                ); 

                // Answer to frontend
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

            await this.ingestService.deleteFile(
                record.file_id, 
                record.vector_store_file_id // SQL 
            ); 

            documentRepository.delete(docId!); 

            res.json({ status: "deleted" }); 
        } catch (err) { 
            console.error(err); 
            res.status(500).json({ error: "Delete failed" }); 
            }
        }; 
    }
