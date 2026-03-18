import OpenAI from "openai";
import { Answer, SourceRef } from "../../models/types";
import { RagService } from "./RagService"; 

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

  private extractSourcesFromResponse(response: any): SourceRef[] { 
    const sources: SourceRef[] = [];

    const blocks = Array.isArray(response?.output) ? response.output : [];

    for (const block of blocks) {
      if (block?.type !== "message") continue;

      // for (const content of block.content ?? []) { 
      //   if (content.type !== "output_text") continue;

      const allAnnotations = 
      block.annotations ?? 
      block.content?.flatMap((c: any) => c?.annotations ?? []) ?? [];

      const fileCitations = allAnnotations.filter((a: any) => a?.type === "file_citation") ?? [];

      // const fileCitations = content.annotations?.filter((a: any) => a.type === "file_citation") ?? [];

      for (const c of fileCitations) { 

        sources.push({ 
          documentName: c?.file_name ?? "unknown",
           page: c?.page_number ?? 0,
           offset: 0,
           fileId: c?.file_id ?? null,
           chunkId: c?.chunk_id ?? null,
           attributes: c?.attributes ?? {}

        });
      }
    }
    return sources;
      
  }

  async answer(
    question: string,
    vectorStoreId?: string,
  ): Promise<Answer> {
    
    const resolvedId = vectorStoreId || this.defaultVectorStoreId;

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
          vector_store_ids: [resolvedId],
          max_num_results: 10,
        },
      ],
    });

    const textParts: string[] = [];
    const blocks = Array.isArray(response.output) ? response.output : [];

    for (const block of blocks) {
      if (block.type !== "message") continue;

      for (const content of block.content ?? []) {
        if (content.type === "output_text") { 
          textParts.push(content.text);
        }
      }
    }

       const sources = this.extractSourcesFromResponse(response);

       // Map doc name to file_id from vectorstore
       console.log("[RAG] resolvedId:", resolvedId);
       const vsFilesPage = await this.client.vectorStores.files.list(resolvedId); 
       console.log("[RAG] vectorStore list:", JSON.stringify(vsFilesPage.data, null, 2));
      
       const filenameToOrigId = new Map<string, string>();
       for (const f of vsFilesPage.data as Array<any>) {
        const filename = f.attributes?.filename as string | undefined;
        const origId = f.attributes?.origFileId as string | undefined;
        if (filename && origId) filenameToOrigId.set(filename, origId);
       }
       console.log("[RAG] filenameToOrigId keys:", [...filenameToOrigId.keys()]);

       for (const src of sources) {
       if (!src.fileId && src.documentName) {
        const mapped = filenameToOrigId.get(src.documentName);
        if (mapped) src.fileId = mapped;
        console.log(`[RAG] filled fileId for ${src.documentName} -> ${src.fileId}`);
       }
      }

      for (const src of sources) { 
        const match = (vsFilesPage.data as any[]).find(
          f => f?.attributes?.origFileId === src.fileId );

         
if (match?.attributes?.storagePath) {
    src.attributes = {
      ...(src.attributes ?? {}),
      storagePath: match.attributes.storagePath,
    };

    console.log(
      `[RAG] storagePath added for ${src.documentName}: ${match.attributes.storagePath}`
    );
  } else {
    console.warn("[RAG] NO storagePath match", {
      documentName: src.documentName,
      fileId: src.fileId,
    });
  }
}

    
    return {
      text: textParts.join("\n").trim(),
      sources,
    };
  }
}
