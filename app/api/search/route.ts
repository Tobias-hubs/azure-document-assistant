import { NextResponse, NextRequest } from "next/server";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}`,
  defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION! },
});

const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT!,
    process.env.AZURE_SEARCH_INDEX_NAME!, 
    new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
);

type SearchDocument = { 
    filename: string; 
    content?: string;
};

export async function POST(req: NextRequest) {
 
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 }

      );
    }

    const embeddingResponse = await openai.embeddings.create({
      model: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Find right documents from Azure Search INDEX based on query
    const results = await searchClient.search(query, {
      top: 5,
      select: ["filename", "content", "imageText"],
      vectorSearch: { 
        queries: [ 
          { 
            kind: "vector",
            value: queryEmbedding,
            fields: ["embedding"],
            kNearestNeighborsCount: 5,
          }
        ]
      } 
    } as any  // Workaround for missing vectorSearch type in SDK. Typesafe is only disabled for the search options, rest of the code is still typed.
  );

    const documents: SearchDocument[] = [];

    for await (const result of results.results) {
      const doc = result.document as SearchDocument;
      documents.push(doc);
    }


    console.log("Search results: ", query); 
    console.log(" Search results: ", documents.map(d => d.filename)
  );
  
    return NextResponse.json({ query, docs: documents });
    }
