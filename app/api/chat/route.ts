import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { query, context } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_KEY!,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultHeaders: {
        "api-key": process.env.AZURE_OPENAI_KEY!,
      },
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an internal document assistant. Use context to answer the user.",
        },
        {
          role: "user",
          content: `Fråga: ${query}\n\nContext:\n${JSON.stringify(context, null, 2)}`
        }
      ],
      temperature: 0.2,
    });

    return NextResponse.json({ answer: response.choices[0].message.content });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Chat error" },
      { status: 500 }
    );
  }
}