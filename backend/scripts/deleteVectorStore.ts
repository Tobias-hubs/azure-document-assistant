import "dotenv/config";
import OpenAI from "openai";

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const vsId = process.env.OPENAI_VECTOR_STORE_ID;

  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  if (!vsId) throw new Error("Missing OPENAI_VECTOR_STORE_ID");

  const client = new OpenAI({ apiKey });

  console.log("Deleting vector store:", vsId);
  console.log("-------------------------------------");

  try {
    const res = await client.vectorStores.delete(vsId);
    console.log("Vector store deleted:", res);
  } catch (err: any) {
    console.error("Failed to delete vector store:", err.message);
  }

  console.log("-------------------------------------");
  console.log("Done.");
}

main().catch(console.error);