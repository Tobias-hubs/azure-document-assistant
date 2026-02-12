import { Answer, Chunk, SourceRef } from "../models/types";
import { VectorStoreAdapter } from "../adapters/vectorStore";
import { LLMClient } from "../adapters/llmClient";

export class RagService {
  constructor(
    private store: VectorStoreAdapter,
    private llm: LLMClient,
    private logger: { logSearch: Function }) {}

  async answer(query: string, docId: string, topK = 5): Promise<Answer> {
    console.log("rag runs"); // sanity check
    console.log("Searching docId:", docId);
    console.log("Total chunks in store:", this.store);

    const t0 = Date.now();

    //  Embed query 
    // SEARCH 4 - Embed the query into a numerical vector representation (used in similaritySearch) 
    const queryEmbedding = await this.llm.embed(query);

    // SEARCH 5 — Retrieve topK relevant chunks for the given docId
    //  Retrieve top-K chunks
    const chunks: Chunk[] = await this.store.similaritySearch(queryEmbedding, docId, topK);
    console.log("Retrieved chunks:", chunks.length);

    // Compose prompt with sources
    // SEARCH 6 — Build final prompt using the query + retrieved chunks
    const prompt = this.composePrompt(query, chunks);
    
    console.log(`[RAG] topK=${topK}, 
      retreivedChunks=${chunks.length}, docId=${docId}`); 
      if (chunks.length > topK) { 
        console.warn("[RAG] More chunks returned than topK"); 
      }

    // SEARCH 7 - Generate answer from LLM
    const answerText = await this.llm.generate(prompt);

    // 5) Collect sources and log
    const sources: SourceRef[] = chunks.map(c => c.sourceRef);
    const latencyMs = Date.now() - t0;
    this.logger.logSearch( docId, query, sources, latencyMs);

    return { text: answerText, sources };
    
  }

  private composePrompt(query: string, chunks: Chunk[]): string {
    const context = chunks.map(c => `- [${c.sourceRef.documentName} p.${c.sourceRef.page}] ${c.text}`).join("\n");
    return [
      "You are a helpful assistant answering based on the provided technical documentation.",
      "Use only the context; cite sources by document and page.",
      `Question: ${query}`,
      "Context:",
      context,
      "Answer:"
    ].join("\n\n");
  }
}