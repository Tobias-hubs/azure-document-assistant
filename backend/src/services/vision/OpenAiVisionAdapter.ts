import OpenAi from "openai";
import { VisionAdapter } from "./VisionAdapter";

export class OpenAIVisionAdapter implements VisionAdapter {
    constructor(private openai: OpenAi) {}

    async annotateImage(base64: string): Promise<string> {
        const response = await this.openai.responses.create({ 
            model: "gpt-4o-mini", 
            input: [ 
                { 
                    role: "user",
                    content: [ 
                        { type: "input_text", text: "Beskriv bilden detaljerat på svenska." },
                        { type: "input_image", 
                            detail: "high",
                            image_url: `data:image/png;base64,${base64}`
                        }
                    ]
                }
            ]
        });

        return pickOutputText(response);
    }
}

// Helper to extract text from OpenAI response
function pickOutputText(response: any): string {
    if (response?.output_text && typeof response.output_text === "string") {
        return response.output_text;
    } 
    const items = Array.isArray(response?.output) ? response.output : [];
    for (const item of items) {
        if (item?.type === "message" && Array.isArray(item.content)) {
            for (const block of item.content) {
                if (block?.type ==="output_text" && typeof block.text === "string") return block.text;
                
                if (block?.type === "text" && typeof block.text === "string") return block.text;

            }
        }
    }
    return ""; 
}