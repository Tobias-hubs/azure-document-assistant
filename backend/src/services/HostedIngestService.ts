import OpenAI from "openai"; 
import { FileDeleteParams } from "openai/resources/vector-stores/files";
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


        await this.client.vectorStores.files.create( 
            this.vectorStoreId, 
            { 
                file_id: uploaded.id, 
                attributes: { 
                    docId: docId, 
                    filename: filename,
                }, 
            }
        ); 
        

        return { 
            fileId: uploaded.id, 
        };
        
    }
       async deleteFile(fileId: string) { 

            // Remove from vectorstore
            await this.client.vectorStores.files.delete(
                fileId, 
                {vector_store_id: this.vectorStoreId}
                
            ); 

            await this.client.files.delete(fileId); 
        
    }
}