import "dotenv/config"; 
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import OpenAI from "openai";

const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT!,
  "document-index-v3",
  new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
);

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}`,
  defaultHeaders: {
    "api-key": process.env.AZURE_OPENAI_KEY!
  },
  defaultQuery: {
    "api-version": process.env.AZURE_OPENAI_API_VERSION!
  }
});

async function run() {
  const results: any = await searchClient.search("*", {
    select: ["id", "content", "imageText"]
  });

  for await (const page of results.byPage({ maxPageSize: 100 })) {
    for (const item of page.results) {
      const doc = item.document;

      const text =
        (doc.content ?? "") + "\n" +
        (doc.imageText ?? "");

      if (!text.trim()) continue;

      const embedding = await openai.embeddings.create({
        model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,
        input: text
      });

      await searchClient.mergeOrUploadDocuments([
        {
          id: doc.id,
          embedding: embedding.data[0].embedding
        }
      ]);

      console.log("Embedded:", doc.id);
    }
  }
}

run().catch(console.error);