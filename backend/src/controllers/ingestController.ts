import { Request, Response } from "express";
import { randomUUID } from "crypto"; 
import { HostedIngestService } from "../services/HostedIngestService";
import { documentRepository } from "../repositories/documentRepository";
import crypto from "crypto";

// TODO Add batch ingest method for uploading multiple files 

export class IngestController { 
    // Dependency Injection
    constructor(private ingestService: HostedIngestService) {}
 
    // INGEST 2 This controller method is called by frontend when a user uploads a PDF. 
    // Handler method for POST /api/ingest
    ingest = async (req: Request, res: Response) => { 
        try { 
            const file = req.file; // PDF-buffer ( From multer)

            if (!file) { 
                return res.status(400).json({ error: "No PDF uploaded" }); 
            }

            // Compute content hash for deduplication (To not be able to upload same file multiple times, even with different names)
            const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");

            // Check for existing document with same content hash
            const existing = documentRepository.findByHash(hash);
            if (existing) { 
                return res.status(409).json({ 
                    error: "duplicate",
                    message: "Document with same content already exists",
                    docId: existing.id,
                    displayName: existing.filename,
                }); 
            }

            const docId = randomUUID(); // NOTE Generate Unique ID (Separate from openai fileId)

            // Send file buffer to HostedIngestService which handles the upload to OpenAI and vector store
            const result = await this.ingestService.uploadFile(
                file.buffer,
                file.originalname,
                docId); // (buffer = binary)  

                // Save metadata in SQLite (local) 
                //Enables deduplication, file management
                documentRepository.create( 
                    docId, 
                    result.fileId, // OpenAI file ID
                    process.env.OPENAI_VECTOR_STORE_ID!,
                    file.originalname, 
                    result.vectorStoreFileId,
                    hash 
                ); 

                // Answer to frontend UploadButton on successful ingest
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

    // Deletes from vectorstore & sqlite
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
                record.vector_store_file_id // SQL Remove SQL from project, try to make vectorstore store instead. 
            ); 

            documentRepository.delete(docId!); 

            res.json({ status: "deleted" }); 
        } catch (err) { 
            console.error(err); 
            res.status(500).json({ error: "Delete failed" }); 
            }
        }; 
    }
