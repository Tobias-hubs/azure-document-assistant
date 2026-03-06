import OpenAI from "openai";
import { Answer } from "../../models/types";
import { RagService } from "./RagService"; 
import { documentRepository } from "../../repositories/documentRepository";

export class HostedRagService implements RagService {
  constructor(
    private client: OpenAI,
    private defaultVectorStoreId: string,
  ) {}

  // SEARCH 4
  // NOTE List files - this is needed to build the system prompt that tells the model which files it can use as sources.
  private async listVectorStoreFiles(vectorStoreId: string): Promise<string[]> {
    const page = await this.client.vectorStores.files.list(vectorStoreId);
    return page.data.map((f) => (f as any).attributes?.filename ?? f.id);
  }

  // System prompt builder (dynamic) 
  private async buildFileAwareness(vectorStoreId: string): Promise<string> {
    const files = await this.listVectorStoreFiles(vectorStoreId);

    return `
    Du har tillgång till följande filer i detta vector store:
    ${files.map((f) => `- ${f}`).join("\n")}

Viktigt:
- Använd ENDAST dessa filer när du ger fakta i svaret.
- Om användaren frågar efter en fil som inte finns här ska du säga det.
- När du citerar information, nämn alltid vilken fil källan kommer ifrån.
  `.trim();
  } // Use Swedish in system prompt to encourage Swedish answers 

  async answer(
    question: string,
    docId?: string,
    vectorStoreId?: string,
  ): Promise<Answer> {
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

    const resolvedId = vectorStoreIds[0];
    if (!resolvedId) {
      throw new Error("No vector store ID provided ");
    }
    const systemPrompt = await this.buildFileAwareness(resolvedId); 

    const response = await this.client.responses.create({
      model: "gpt-5.2", // TODO gpt 5? gpt-4.1 turbo (for image support)?
      input: [ 
        { role: "system", content: systemPrompt }, 
        { role: "user", content: question }
      ],
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
          content.annotations?.filter((a) => a.type === "file_citation") ?? [];

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
