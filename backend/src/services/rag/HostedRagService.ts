import OpenAI from "openai";
import { Answer } from "../../models/types";
import { RagService } from "./RagService"; 

export class HostedRagService implements RagService {
  constructor(
    private client: OpenAI,
    private vectorStoreId: string
  ) {}

  async answer(question: string, docId: string): Promise<Answer> {

    const response = await this.client.responses.create({
      model: "gpt-4.1-mini", // gpt 5? 
      input: question,
      
      tools: [
        {
          type: "file_search",
          // TODO VectorStore ID?   vector_store_ids: ["<your_vector_store_id>"],
          vector_store_ids: [this.vectorStoreId], 
          max_num_results: 2, // To limit token use and response time
            filters: { 
              type: "eq", // "equals"
              key: "docId",
              value: docId,
      },

        }
      ],
     
    });

    let text = "";
    const sources: Answer["sources"] = []; 

    for (const item of response.output ?? []) {
      if (item.type !== "message") continue;

      for (const content of item.content ?? []) {
        if (content.type !== "output_text") continue;

        text += content.text + "\n";

        const citations =
          content.annotations?.filter(
            (a) => a.type === "file_citation" 
          ) ?? [];

        for (const c of citations) {
          if ("filename" in c) {
          sources.push({
            documentName: c.filename ?? "Unknown",
            page: 0,
            offset: 0,
          });
        }
      }
    }
  }

    return {
      text: text.trim(),
      sources,
    };
  }
}
