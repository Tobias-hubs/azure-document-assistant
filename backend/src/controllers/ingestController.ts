import { Request, Response } from "express";
import { randomUUID } from "crypto"; 
import { HostedIngestService } from "../services/HostedIngestService";


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
                return res.status(400).json({ error: "No file uploaded" }); 
            }

            const { buffer, originalname, mimetype } = file;

         //   const docId = randomUUID(); // NOTE Generate Unique ID (Separate from openai fileId)

            // Send file buffer to HostedIngestService which handles the upload to OpenAI and vector store
            const result = await this.ingestService.uploadFile(
                file.buffer,
                file.originalname,
                mimetype,
               
            ); 

                // Answer to frontend UploadButton on successful ingest
           return res.json({ 
                status: "ok",
             
                filename: file.originalname,  
                fileId: result.fileId,
                vectorStoreFileId: result.vectorStoreFileId
            });
        } catch (err) { 
            console.error(err); 
            res.status(500).json({ error: "Document ingest failed"}); 
        }
    };

    // Delete from vectorstore 
    delete = async(
        req: Request<{ fileId: string; vectorStoreFileId: string }>,
        res: Response
    ) => { 
        try { 
            const { fileId, vectorStoreFileId } = req.params;

            if(!fileId || !vectorStoreFileId) { 
                return res.status(400).json({ error: "Missing fileId or vectorStoreFileId"}); 
            } 

            const fileIdStr = Array.isArray(fileId) ? fileId[0] : (fileId as string);
            const vsFileIdStr = Array.isArray(vectorStoreFileId) ? vectorStoreFileId[0] : (vectorStoreFileId as string);

            await this.ingestService.deleteFile(
               fileIdStr,
               vsFileIdStr
            ); 

          return res.json({ status: "deleted" }); 
        } catch (err) { 
            console.error(err); 
            return res.status(500).json({ error: "Delete failed" }); 
            }
        }; 
    }
