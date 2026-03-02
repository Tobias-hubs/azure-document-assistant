import "dotenv/config";
import OpenAI from "openai";

// Terminal : 
// cd backend
//>> npx ts-node scripts/debugVectorStore.ts

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (!process.env.OPENAI_VECTOR_STORE_ID) {
    throw new Error("Missing OPENAI_VECTOR_STORE_ID");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const vsId = process.env.OPENAI_VECTOR_STORE_ID;

  console.log("Debugging Vector Store:", vsId);
  console.log("--------------------------------------------------");

  // Hämta vector store info
  const store = await client.vectorStores.retrieve(vsId);
  console.log("Store info:");
  console.dir(store, { depth: null });
  console.log("--------------------------------------------------");

  // Lista filer
  const files = await client.vectorStores.files.list(vsId);

  console.log(`Files in store (${files.data.length}):`);

  for (const file of files.data) {
    console.log("--------------------------------------------------");
    console.log("File ID:", file.id);
    console.log("Status:", file.status);
    console.log("Metadata:", file.attributes);
  }

  console.log("--------------------------------------------------");

  if (files.data.length === 0) {
    console.log("No files in vector store.");
    return;
  }

  // Test search
  console.log("Testing search...");
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "Vad handlar dokumentet om?",
    tools: [
      {
        type: "file_search",
        vector_store_ids: [vsId],
      },
    ],
  });

  console.log("--------------------------------------------------");
  console.log("Search response:");

  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;

    for (const content of item.content ?? []) {
      if (content.type !== "output_text") continue;

      console.log("\nText:");
      console.log(content.text);

      const citations =
        content.annotations?.filter(a => a.type === "file_citation") ?? [];

      for (const c of citations) {
        console.log("Citation from file:", "filename" in c ? c.filename : "unknown");
      }
    }
  }

  console.log("--------------------------------------------------");
  console.log("Debug complete.");
}

main().catch(err => {
  console.error("Error during debug:");
  console.error(err);
});
