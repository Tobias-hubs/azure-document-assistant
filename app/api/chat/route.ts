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
    .map((doc: any, i: number) => { 
      const text = doc.content ? `DOCUMENT TEXT:\n${doc.content}` : "";
      const images = doc.imageText ? `IMAGE DESCRIPTION:\n${doc.imageText}` : "";

      return `Source ${i + 1}:\n${[text, images].filter(Boolean).join("\n\n")}`;
    })
    .join("\n\n---\n\n");

    // System prompt with instructions to limit the models behavior & minimize hallucinations. 
  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages: [
      {
        role: "system",
        content: `
      Du är en hjälpsam assistent.
      Svara endast baserat på given kontext.

      
      Du har tillgång till dokumenttext och interna bildbeskrivningar.
      Använd informationen för att svara naturligt.


      Viktiga regler:
      - Nämn aldrig hur informationen är strukturerad.
      - Nämn aldrig rubriker eller interna termer (t.ex. DOCUMENT TEXT eller IMAGE DESCRIPTION).
      - Skriv svaret som om du själv hade granskat dokumentet.

      `,
      },
      {
        role: "user",
        content: `KONTEXT:\n${context}\n\nFRÅGA:\n${question}`,
      },
    ],
  });

  const text = response.choices[0].message.content;

  return NextResponse.json({
    answer: text?.replace("[NEEDS_VISION]", "").trim(), 
    needsVision: text?.includes("[NEEDS_VISION]"),
  });
}
