export const runtime = "nodejs";
console.log("vision route called");
import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import { getBlobSasUrl } from "@/lib/sasHelper";

const client = new AzureOpenAI({ 
    apiKey: process.env.AZURE_OPENAI_KEY!, 
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!, 
    apiVersion: "2024-12-01-preview",
}); 

export async function POST(req: NextRequest) {
    console.log("vision POST request received"); 

    const { question } = await req.json();


    if (!question) {
        return NextResponse.json({ error: "Missing blobName or question" }, 
            { status: 400 }
        );
    }

     const blobName = "animal-8748794_1280.jpg"; // VISION Needs raw image format not PDF - Hardcoded (choice not data) for vision testing,


    const sasUrl = getBlobSasUrl( 
        process.env.AZURE_STORAGE_CONTAINER_NAME!, 
        blobName
    );
    
    console.log("Generated SAS URL:", sasUrl);

    // const imageUrl = pageNumber 
    // ? `${sasUrl}&page=${pageNumber}` 
    // : sasUrl;

    const response = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT!,
        messages: [
            { 
                role: "user", 
                content: [ 
                    { type: "text", text: question },
                    { type: "image_url",
                     image_url: { url: sasUrl } 
                    
                    }
                ]
            }
        ]
} );

return NextResponse.json({
    answer: response.choices[0].message.content,
    imageUrl: sasUrl,    
});
}