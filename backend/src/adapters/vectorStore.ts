import { Chunk } from "../models/types";

export interface VectorStoreAdapter {
  upsert(docId: string, chunks: Chunk[]): Promise<void>;
  similaritySearch(embedding: number[], docId: string, topK: number): Promise<Chunk[]>;


}
