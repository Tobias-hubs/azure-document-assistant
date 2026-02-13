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
// FIX embedding array is empty 
  async similaritySearch(embedding: number[], docId: string, topK: number): Promise<Chunk[]> {
    // Simulate similarity search – return random chunks
    // In a real implementation, this would use cosine similarity on embeddings
   
    // Filter chunks from this document "docID"(UUID)
    const filtered = this.chunks.filter(c => c.docId === docId); 

    // Calculate similarity for each chunk
    const scored = filtered.map(chunk => ({ 
      chunk, 
      score: this.cosineSimilarity(embedding, chunk.embedding)
    })); 

    // Sort by relevance (highest first) 
    scored.sort((a, b) => b.score - a.score); 

    // take topK 
    return scored.slice(0, Math.min(topK, filtered.length)) 
  .map(s => s.chunk); 
  } 

   // Cosine similarity-calc
   private cosineSimilarity(a: number[], b: number[]): number { 
   
    // Guard for undefined 
    if (!a || !b || a.length === 0 || b.length === 0) { 
      return 0; 
    }
   
    if (a.length !== b.length ) return 0; 

    let dotProduct = 0; 
    let normA = 0; 
    let normB = 0; 

    for (let i = 0; i < a.length; i++) { 
      const aValue = a[i] ?? 0; 
      const bValue = b[i] ?? 0; 

        dotProduct += aValue * bValue; 
        normA += aValue * aValue;
        normB += bValue * bValue;
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB); 
    return denominator === 0 ? 0 : dotProduct / denominator; 
   }
  }

