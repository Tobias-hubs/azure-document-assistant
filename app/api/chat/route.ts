import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY!,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT!,  
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
  apiVersion: "2024-12-01-preview",
});

export async function POST(req: NextRequest) {
  const { question, docs } = await req.json();

  if (!question || !Array.isArray(docs)) {
    return NextResponse.json(
      { error: "Missing question or docs" },
      { status: 400 }
    );
  }

  const context = docs
    .map((doc: any, i: number) => `Source ${i + 1}:\n${doc.content}`)
    .join("\n\n");

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages: [
      {
        role: "system",
        content:
          "Du är en hjälpsam assistent. Svara endast baserat på given kontext. Om svaret inte finns i kontexten, säg det tydligt.",
      },
      {
        role: "user",
        content: `KONTEXT:\n${context}\n\nFRÅGA:\n${question}`,
      },
    ],
  });

  return NextResponse.json({
    answer: response.choices[0].message.content,
  });
}
