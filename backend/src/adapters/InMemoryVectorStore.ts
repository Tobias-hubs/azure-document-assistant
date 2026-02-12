import { VectorStoreAdapter } from "./vectorStore";
import { Chunk } from "../models/types";

export class InMemoryVectorStore implements VectorStoreAdapter {
  private chunks: Chunk[] = [];

  async upsert(docId: string, chunks: Chunk[]): Promise<void> {
    // Remove existent chunks for same doc 
    this.chunks = this.chunks.filter(c => c.docId !== docId); 

    // New chunks
    this.chunks.push(...chunks);

    if (process.env.DEBUG_RAG === "true") { 
      for (const c of chunks) { 
        console.log("Stored chunk:", { 
          docId, 
          id: c.id, 
          length: c.text?.length ?? 0,

        });
      } 
      console.log(`[VectorStore]
        totalChunks=${this.chunks.length}`); 
    } 
  }

  async similaritySearch(embedding: number[], docId: string, topK: number): Promise<Chunk[]> {
    // Simulate similarity search – return random chunks
    // In a real implementation, this would use cosine similarity on embeddings
   // 
    const filtered = this.chunks.filter(c => c.docId === docId); 

    const shuffled = [...filtered].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, Math.min(topK, filtered.length));
  }
}
