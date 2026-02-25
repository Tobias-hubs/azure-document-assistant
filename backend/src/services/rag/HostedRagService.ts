import OpenAI from "openai";
import { Answer } from "../../models/types";
import { RagService } from "./RagService"; 
import { documentRepository } from "../../repositories/documentRepository";

export class HostedRagService implements RagService {
  constructor(
    private client: OpenAI,
    private vectorStoreId: string
  ) {}

  async answer(question: string, docId: string): Promise<Answer> {

    const doc = documentRepository.findById(docId);
    if (!doc) {
      throw new Error("Document not found in repository: " + docId);
    }

    const response = await this.client.responses.create({
      model: "gpt-4.1-mini", // gpt 5? 
      input: question,
      
     
  tools: [
    {
      type: "file_search",
      vector_store_ids: [this.vectorStoreId],
      max_num_results: 5
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
