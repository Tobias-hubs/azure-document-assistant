import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { question, searchResults } = await req.json();

  if (!question || !searchResults) {
    return NextResponse.json(
      { error: "Missing question or searchResults" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    answer: `Jag hittade ${searchResults.length} relevanta stycken.`,
    sources: searchResults
  });
}
