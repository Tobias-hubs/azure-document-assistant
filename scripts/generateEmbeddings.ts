import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import fetch from "node-fetch";

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT!;
const SEARCH_KEY = process.env.AZURE_SEARCH_API_KEY!;
const INDEX_NAME = "document-index-v3";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}`,
  defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION! },
});

/**
 * 1️⃣ Hämta dokument (batch)
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
      top,
      skip,
      select: "id,content,imageText",
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/**
 * 2️⃣ Uppdatera embeddings
 */
async function uploadEmbedding(id: string, embedding: number[]) {
  const url = `${SEARCH_ENDPOINT}/indexes/${INDEX_NAME}/docs/index?api-version=2023-11-01`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": SEARCH_KEY,
    },
    body: JSON.stringify({
      value: [
        {
          "@search.action": "merge",
          id,
          embedding,
        },
      ],
    }),
  });
}

async function run() {
  let skip = 0;
  const batchSize = 10;

  while (true) {
    const data = await fetchDocuments(skip, batchSize);
    const docs = (data as { value: any[] }).value;

    if (!docs.length) break;

    for (const doc of docs) {
      const text = `
${doc.content ?? ""}
${doc.imageText ?? ""}
`.trim();

      if (!text) continue;

      const emb = await openai.embeddings.create({
        model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,
        input: text,
      });

      await uploadEmbedding(doc.id, emb.data[0].embedding);
      console.log("Embedded:", doc.id);
    }

    skip += batchSize;
  }

  console.log("✅ All embeddings done");
}

run().catch(console.error);