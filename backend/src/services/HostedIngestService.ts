import OpenAI from "openai"; 
import { Readable } from "stream"; 
import { toFile } from "openai";
import * as fs from "fs/promises";
import * as path from "path";


// INGEST 3 integration with openAI SDK 
export class HostedIngestService { 
    constructor( 
        private client: OpenAI, 
        private vectorStoreId: string 
    ) {}

    async uploadFile(
        buffer: Buffer, 
        filename: string, 
        mimetype: string
    ) {

        // const uint8 = new Uint8Array(buffer); 
        // const file = new File([uint8], filename, { 
        //     type: "application/pdf",
        // });

        // Upload file to OpenAI Files
        const uploaded = await this.client.files.create({ 

            file: await toFile(buffer, filename, { 
                type: mimetype || "application/octet-stream"
             }), 
             purpose: "user_data", // NOTE "assistants" is read only (for openAI ) that is why vision not working 
        });
        

        // Local save for pdfium
        const localPath = path.resolve( 
            process.cwd(), 
            "storage/originals", 
            `${uploaded.id}_${filename}`
        ); 

        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, buffer);

        // Link to vector store
        const vsFile = await this.client.vectorStores.files.create(
            this.vectorStoreId, 
              { file_id: uploaded.id, 

                // Metadata 
                attributes: { 
                    filename: filename, 
                    uploadedAt: new Date().toISOString(), 
                    origFileId: uploaded.id, // Keep track of original file ID for vision
                    storagePath: localPath,
                 }
               } 
        );
        console.log("File uploaded", this.vectorStoreId);
        
        // Polling for file processing completion (vector store ingestion)
        await this.pollFileReady(vsFile.id);

        // Save file references for later use (deletion, management) 
        return { 
            fileId: uploaded.id, 
            vectorStoreFileId: vsFile.id,
        }; 
    }

    private async pollFileReady(vectorStoreFileId: string, interval = 3000, timeout = 60000) { 
        const start = Date.now();
        while (true) { 
            const statusResponse = await this.client.vectorStores.files.retrieve(
                vectorStoreFileId, 
                { vector_store_id: this.vectorStoreId }
            );

            if (statusResponse.status === "completed") { 
                return; 
            }
            
            if (Date.now() - start > timeout) { 
                throw new Error("File processing timed out"); 
            }

            await new Promise((res) => setTimeout(res, interval));
        }
    }
    // fileId = openAi file reference, vectorStoreFileId = reference in vector store (for deletion)
       async deleteFile(fileId: string | null | undefined, vectorStoreFileId: string) { 

        try { 
            // SDK requires FileDeleteParams object with {vector_store_id}: string;
            await this.client.vectorStores.files.delete(
               vectorStoreFileId,
               { vector_store_id: this.vectorStoreId }   // NOTE This was troublesome due to SDK version changes!
            ); 
        } catch (err) {
            console.error("Error deleting from vector store:", err);
            // Continue with file deletion even if vector store deletion fails
        }

        if (!fileId || fileId === "null" || fileId === "undefined") {
            console.warn("No valid fileId provided, skipping OpenAI file deletion");
            return{ status: "deleted" };
        }

        try { 
            await this.client.files.delete(fileId); 
        } catch (err: any) {
            if (err.status === 404) {
                console.warn(`File with ID ${fileId} not found in OpenAI, might have been already deleted.`);
            } else {
            console.error("Error deleting file from OpenAI:", err);
        }   
    }
            return { status: "deleted" };   

        
    
    }
}
