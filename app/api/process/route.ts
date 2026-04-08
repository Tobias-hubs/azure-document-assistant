import { NextRequest, NextResponse } from "next/server"; 
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT!,
    process.env.AZURE_SEARCH_INDEX_NAME!, 
    new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
); 

export async function POST(req: NextRequest) { 
    const { text, blobUrl, filename } = await req.json(); 

    if (!text) { 
        return NextResponse.json({error: "Missing text" }, { status: 400 }

        );
    }

  await searchClient.uploadDocuments([

    {
        id: crypto.randomUUID(),
        content: text, 
        filename,
        blobUrl
    }
  ]);

  return NextResponse.json({
    success: true
  });
}
