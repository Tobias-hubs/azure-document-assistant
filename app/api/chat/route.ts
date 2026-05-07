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
      return `Source ${i + 1}:\n${[text].filter(Boolean).join("\n\n")}`;
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

      Du har tillgång till dokumenttext.
      Använd informationen för att svara korrekt och försiktigt.

     Viktiga regler:
    - Nämn aldrig hur informationen är strukturerad.
    - Nämn aldrig interna termer eller tekniska detaljer.
    - Skriv svaret som om du själv hade granskat dokumentet.

    TEXT FÖRST:
   - Om frågan kan besvaras med text, gör det.
   - Om information saknas i texten, säg tydligt att den inte finns i dokumenten.
   - Gissa aldrig.

   VISION (ENDAST VID EXPLICIT BEHOV):
   - Använd Vision ENDAST om användaren uttryckligen och tydligt ber om visuell analys
    som INTE kan besvaras med text, t.ex.:
    - färg, form, layout
    - detaljer i diagram eller bilder
    - exakt hur något ser ut visuellt
    - "visa bilden", "hur ser det ut"

   - Om och endast om detta är fallet,
     svara exakt med: [NEEDS_VISION]

   - Använd ALDRIG Vision som fallback för textfrågor.

   
  FÖRBUD:
  - Använd inte Vision för frågor om huruvida dokument innehåller bilder.
  - Använd inte Vision för metadata- eller existensfrågor.
  - Använd inte Vision om ett korrekt text-svar är möjligt.


      `,
      },
      {
        role: "user",
        content: `KONTEXT:\n${context}\n\nFRÅGA:\n${question}`,
      },
    ],
  });

  const text = response.choices[0].message.content ?? "";

  const hasVisualIntent = /visa|hur ser|färg|form|layout|detaljer|bilden/i.test(question);

  const needsVision = hasVisualIntent && text.includes("[NEEDS_VISION]");

  return NextResponse.json({
    answer: text.replace("[NEEDS_VISION]", "").trim(), 
    needsVision,
    page: 1,
  });
}
