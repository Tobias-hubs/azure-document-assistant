import OpenAI from "openai"; 
import { Readable } from "stream"; 

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

        const uploaded = await this.client.files.create({ 
            file, 
            purpose: "assistants",
        }); 

        const vsFile = await this.client.vectorStores.files.create(
            this.vectorStoreId, 
              { file_id: uploaded.id }
        );


        await this.client.vectorStores.files.create( 
            this.vectorStoreId, 
            { 
                file_id: uploaded.id, 
                // To be able to filter / search metadata later
                attributes: { 
                    docId: docId, 
                    filename: filename,
                }, 
            }
        ); 
        

        return { 
            fileId: uploaded.id, 
            vectorStoreFileId: vsFile.id,
        };
        
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