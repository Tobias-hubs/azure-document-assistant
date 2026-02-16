import OpenAI from "openai"; 
import { LLMClient } from "./llmClient";

export class OpenAILLMClient implements LLMClient { 
    private client: OpenAI; 

    constructor() { 
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
    }); 

}

async embed(text: string): Promise<number[]> { 
    const result = await this.client.embeddings.create({
        model: "text-embedding-3-large", 
        input: text
    }); 

    const embedding = result.data?.[0]?.embedding; 
    if (!embedding) { 
        throw new Error("Fail to generate embedding")
    }
    return embedding; 
}

async generate(prompt: string): Promise<string> { 
    const result = await this.client.chat.completions.create({
        model: "gpt-4o-mini", // Change to openAi 5 version ? 
        messages: [{ role: "user", content: prompt }],
    }); 

    const message = result.choices?.[0]?.message?.content; 

    if (!message) { 
        throw new Error("OpenAI returned no content");
    }
    return message;

    }

}