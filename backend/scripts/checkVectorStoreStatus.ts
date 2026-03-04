 import OpenAi from "openai";
 import dotenv from "dotenv";

 dotenv.config();

const client = new OpenAi({ 
    apiKey: process.env.OPENAI_API_KEY!, 

}); 

const vectorStoreId =  process.env.OPENAI_VECTOR_STORE_ID!; 

if (!vectorStoreId) {
    throw new Error("Missing VectorStore in .env");
}

async function checkVectorStoreFiles() {

try { 
// list all files in vector store
const filesResponse = await client.vectorStores.files.list(vectorStoreId);

if (!filesResponse.data || filesResponse.data.length === 0) { 
    console.log("No files found in vector store.");
    return; 

} 

console.log(`Found ${filesResponse.data.length} files in vector store ${vectorStoreId}:`);

for (const file of filesResponse.data) { 
    console.log(`File ID: ${file.id}`); 
    console.log(` Filename: ${file.attributes?.filename || "Unknown"}`);  
    console.log(` Doc ID: ${file.attributes?.docId || "Unknown"}`);
    console.log(` Status: ${file.status}`); 
    console.log(` Chunks count: ${(file as any).file.file_counts?.completed || 0}`); 
    } 
} catch (error) { 
    console.error("Error checking vector store files:", error); 
    }
}

checkVectorStoreFiles();




