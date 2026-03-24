import { NextResponse } from "next/server";
import {
  SearchClient,
  AzureKeyCredential,
} from "@azure/search-documents";

export async function GET() {
  try {
    const client = new SearchClient(
      process.env.AZURE_SEARCH_ENDPOINT!,
      process.env.AZURE_SEARCH_INDEX_NAME!,
      new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY!)
    );

    const result = await client.search("*", {
      top: 50,
      select: ["id", "title", "filename", "blobUrl", "uploadedAt"],
      orderBy: ["uploadedAt desc"],
    });

    const docs: any[] = [];
    for await (const item of result.results) {
      docs.push(item.document);
    }

    return NextResponse.json(docs);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load documents" },
      { status: 500 }
    );
  }
}
