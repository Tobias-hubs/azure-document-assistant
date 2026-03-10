import OpenAI from "openai"; 
import { Readable } from "stream"; 

// INGEST 3 integration with openAI SDK 
export class HostedIngestService { 
    constructor( 
        private client: OpenAI, 
        private vectorStoreId: string 
    ) {}

    async uploadFile(
        buffer: Buffer, 
        filename: string, 
        docId: string
    ) {

        const uint8 = new Uint8Array(buffer); 
        const file = new File([uint8], filename, { 
            type: "application/pdf",
        });

        // Upload file to OpenAI Files
        const uploaded = await this.client.files.create({ 
            file, 
            purpose: "assistants",
        }); 


        // Link to vector store
        const vsFile = await this.client.vectorStores.files.create(
            this.vectorStoreId, 
              { file_id: uploaded.id, 

                // Metadata 
                attributes: { 
                    docId: docId, 
                    filename: filename, 
                 }
               } 
        );
        
        // Polling for file processing completion (vector store ingestion)
        await this.pollFileReady(vsFile.id);

        // Save file references for later use (deletion, management) (SQLite will have docId → vectorStoreFileId + fileId for management)
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
       async deleteFile(fileId: string, vectorStoreFileId: string) { 

            // SDK requires FileDeleteParams object with {vector_store_id}: string;
            await this.client.vectorStores.files.delete(
               vectorStoreFileId, 
               { vector_store_id: this.vectorStoreId } // NOTE This was troublesome due to SDK version changes!
               
                // fileId, 
                // {vector_store_id: this.vectorStoreId} 
                
            ); 

            await this.client.files.delete(fileId); 
        
    }
}