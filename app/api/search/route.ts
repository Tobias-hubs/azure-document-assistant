import { NextResponse, NextRequest } from "next/server";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

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

    // Find right documents from Azure Search INDEX based on query
    const results = await searchClient.search(query, {
      top: 5,
      select: ["filename", "content"],
    });

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
