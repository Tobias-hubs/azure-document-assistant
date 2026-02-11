import { VectorStoreAdapter } from "./vectorStore";
import { Chunk } from "../models/types";

export class MockVectorStore implements VectorStoreAdapter {
  private chunks: Chunk[] = [];

  async upsert(docId: string, chunks: Chunk[]): Promise<void> {
    this.chunks.push(...chunks);
    console.log(`Mock: Lagrade ${chunks.length} chunks för dokument ${docId}`);
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
