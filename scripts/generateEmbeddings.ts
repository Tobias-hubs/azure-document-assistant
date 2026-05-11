import dotenv from "dotenv";
dotenv.config({ path: ".env.local" }); 

import OpenAI from "openai";
import fetch from "node-fetch";

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT!;
const SEARCH_KEY = process.env.AZURE_SEARCH_API_KEY!;
const INDEX_NAME = "document-index-v4";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}`,
  defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION! },
});

function chunkText(text: string, size = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  } 
  return chunks; 
} 

/**
 * Fetch documents from Index
 */
async function fetchDocuments(skip = 0, top = 50) {
  const url = `${SEARCH_ENDPOINT}/indexes/${INDEX_NAME}/docs/search?api-version=2023-11-01`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": SEARCH_KEY,
    },
    body: JSON.stringify({
      search: "*",
     // filter: "embeddingStatus eq null",  Only fetch documents that haven't been embedded yet.
      top,
      skip,
      select: "id, content",
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

// Main function to upload embedding back to Index
async function run() {
  let skip = 0;
  const batchSize = 5;

  while (true) {
    const data = await fetchDocuments(skip, batchSize);
    const docs = (data as { value: any[] }).value;

    if (!docs.length) break;

    for (const doc of docs) {
      if (doc.id.includes("_")) { 
        continue; 
      }
  
      const fullText = doc.content ?? "";


      if (!fullText.trim()) continue;

      const chunks = chunkText(fullText, 1000); 

      console.log(`Splitting ${doc.id} into ${chunks.length} chunks`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        if (!chunk.trim()) continue;

      const emb = await openai.embeddings.create({
        model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,
        input: chunk,
      });

      await fetch(`${SEARCH_ENDPOINT}/indexes/${INDEX_NAME}/docs/index?api-version=2023-11-01`, {
        method: "POST", 
        headers: { 
          "Content-Type": "application/json",
          "api-key": SEARCH_KEY,
        }, 
        body: JSON.stringify({
          value: [ 
            { 
              "@search.action": "upload", 
              id: `${doc.id}_${i}`,
              content: chunk, 
              filename: doc.filename,
              embedding: emb.data[0].embedding,
              embeddingStatus: "ready",
            },
          ],
        }),
      });

      console.log(`Chunk ${i} uploaded`);
      }
    }

    skip += batchSize;
  }

  console.log("✅ All chunks embedded ");
}

run().catch(console.error);