import "dotenv/config";

import OpenAI from "openai";

async function main() { 
    if (process.env.OPENAI_VECTOR_STORE_ID) { 
    console.log("Vector store already configured!"); 
    return; 
}

if (!process.env.OPENAI_API_KEY) { 
    throw new Error("Missing OPENAI_API_KEY"); 

}
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


  const vs = await client.vectorStores.create({
    name: "my-rag-store", // NOTE Change to name of choice
  });
  
  console.log("Vector Store Created!"); 
  console.log("ID:", vs.id);
}


main().catch(console.error);

