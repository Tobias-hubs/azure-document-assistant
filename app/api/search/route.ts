import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  SearchClient,
  AzureKeyCredential,
} from "@azure/search-documents";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // 1. Generate embedding from Azure OpenAI
    const openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY!,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultHeaders: {
        "api-key": process.env.AZURE_OPENAI_KEY!,
      },
    });

    const embeddingResp = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: query,
    });

    const vector = embeddingResp.data[0].embedding;

    // 2. Vector search mot Azure Search
    const searchClient = new SearchClient(
      process.env.AZURE_SEARCH_ENDPOINT!,
      process.env.AZURE_SEARCH_INDEX_NAME!,
      new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
    );

    const searchResults = await searchClient.search("", {
      vector: {
        value: vector,
        k: 5,
        fields: "contentVector",
      },
      select: ["id", "title", "filename", "content", "blobUrl"],
    });

    const docs: any[] = [];
    for await (const result of searchResults.results) {
      docs.push(result.document);
    }

    return NextResponse.json({ query, docs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Search error" },
      { status: 500 }
    );
  }
}