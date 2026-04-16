/* import { NextRequest, NextResponse } from "next/server"; 
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { AzureOpenAI } from "openai";
import crypto from "crypto";

const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT!,
    process.env.AZURE_SEARCH_INDEX_NAME!, 
    new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
); 

const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  apiVersion: "2024-12-01-preview",

});

export async function POST(req: NextRequest) { 
    const { text, blobUrl, filename } = await req.json(); 

    if (!text) { 
        return NextResponse.json({error: "Missing text" }, { status: 400 }

        );
    }

    const embeddingResponse = await openai.embeddings.create({ 
      model: "text-embedding-3-small",
      input: text
    }); 

    const embedding = embeddingResponse.data[0].embedding;

  await searchClient.uploadDocuments([

    {
        id: crypto.randomUUID(),
        content: text, 
        embedding,
        filename,
        blobUrl
    }
  ]);

  return NextResponse.json({
    success: true
  });
}
  */