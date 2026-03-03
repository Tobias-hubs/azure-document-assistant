import OpenAI from "openai";
import { Answer } from "../../models/types";
import { RagService } from "./RagService"; 
import { documentRepository } from "../../repositories/documentRepository";

export class HostedRagService implements RagService {
  constructor(
    private client: OpenAI,
    private defaultVectorStoreId: string
  ) {}

  async answer(question: string, docId?: string, vectorStoreId?: string): Promise<Answer> {
    const textChunks: string[] = [];
    const sources: Answer["sources"] = [];
 
    let vectorStoreIds: string[]; 
    if (docId) {
      const doc = documentRepository.findById(docId); 
      if (!doc) throw new Error("Document not found: " + docId); 

      // file_search expects vector store id that start with "vs"
      vectorStoreIds = [doc.vector_store_id];
    } else if (vectorStoreId || this.defaultVectorStoreId) { 
      vectorStoreIds = [vectorStoreId || this.defaultVectorStoreId];
    } else { 
      throw new Error("Vector store ID or docid needed for search");
    }

    const response = await this.client.responses.create({
      model: "gpt-4.1-mini", // TODO gpt 5? gpt-4.1 turbo (for image support)? 
      input: question,    
      tools: [ 
        {
          type: "file_search",
          vector_store_ids: vectorStoreIds,  
          max_num_results: 10,
        },
      ],
    });


    for (const item of response.output ?? []) {
      if (item.type !== "message") continue;

      for (const content of item.content ?? []) {
        if (content.type !== "output_text") continue;

        textChunks.push(content.text);

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
      text: textChunks.join("\n").trim(),
      sources,
    };
  }
}
