import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({ 
    apiKey: process.env.AZURE_OPENAI_KEY!, 
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!, 
    apiVersion: "2024-12-01-preview",
}); 

export async function POST(req: NextRequest) {
    const { pdfUrl, pageNumber, question } = await req.json();

    if (!pdfUrl || !pageNumber || !question) {
        return NextResponse.json({ error: "Missing pdfUrl, pageNumber or question" }, { status: 400 });
    }

    const pageUrl = `${pdfUrl}/pages/${pageNumber}`;

    const response = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT!,
        messages: [
            { 
                role: "user", 
                content: [ 
                    { type: "text", text: question },
                    { type: "image_url",
                     image_url: { url: pageUrl } 
                    
                        }

                ]
            }
        ]
} );

return NextResponse.json({
    answer: response.choices[0].message.content,
    imageUrl: pageUrl,    
});
}