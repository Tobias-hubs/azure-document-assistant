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
 
  // Search in vector store (with vectorStoreId or default) 
    const vectorId = vectorStoreId || this.defaultVectorStoreId;

   // let vectorId = vectorStoreId || this.defaultVectorStoreId; // If vectorstore exists & are truthy use it. or not (eg undefined) then use default

    if (!docId && !vectorId) {
      throw new Error("Vector store ID or docid needed for search");
    }

    let response; 
    if (docId) {
     
    const doc = documentRepository.findById(docId);  // Previously uploaded document (with docId) 
    if (!doc) throw new Error("Document not found in repository: " + docId); 
      // BUGFIX - Sources 
    //   return { text: "Dokument inte hittat", sources: [] }; 
    // } else if (vectorStoreId) {
    //   return { text: "vectorStore result", sources: [] };
    // } else { 
    //   throw new Error("Vector store ID or docid needed for search");

     response = await this.client.responses.create({
      model: "gpt-4.1-mini", // TODO gpt 5? gpt-4.1 turbo (for image support)? 
      input: question,    
      tools: [ 
        {
          type: "file_search",
          vector_store_ids: [docId], 
          max_num_results: 5
        },
      ],
      include: ["file_search_call.results"], // REFACTOR This makes for loop for sources redundant or can be simplified? 
    });

   } else {
   
      response = await this.client.responses.create({
      model: "gpt-4.1-mini", // TODO gpt 5? gpt-4.1 turbo (for image support)? 
      input: question,
      
                            // TODO query rewriting for better search results?
    
  tools: [
    {
      type: "file_search",
      vector_store_ids: [vectorId],
      max_num_results: 5
    },
  ],
  include: ["file_search_call.results"],

});
}
// REFACTOR 
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
