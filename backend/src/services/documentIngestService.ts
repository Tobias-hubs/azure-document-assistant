// import fs from "fs";
// import path from "path";
import { PdfService } from "./pdfService";
import { VectorStoreAdapter } from "../adapters/vectorStore";
import { Chunk } from "../models/types";
import { LLMClient } from "../adapters/llmClient";

export class DocumentIngestService {
  // Dependency injection
  constructor(
    private pdfService: PdfService,
    private vectorStore: VectorStoreAdapter,
    private llm: LLMClient,
  ) {}

  async ingestBuffer(buffer: Buffer, docId: string): Promise<void> {

    // INGEST 5 - pdfService class extracts text with pdf-parse from the binary PDF buffer 
    const text = await this.pdfService.extractText(buffer); 


    // Token & chunk settings for sliding-window chunking (divide text in chunks(parts) & overlap to keep context when AI read chunks)
    const CHUNK_SIZE = 900;
    const OVERLAP = 100;
    const MAX_CHUNKS = 2000; // Safety limit 

    const chunks: Chunk[] = [];

    let start = 0;
    let index = 0;

    // Approximate token count (1 token = 4 characters)
    const approxTokens = Math.ceil(text.length / 4);

    console.log({
      approxTokens,
      estimatedChunks: Math.ceil(approxTokens / (CHUNK_SIZE - OVERLAP)),
    });
    // INGEST 6 - Chunk the extracted text using sliding window logic.
    while (start < text.length) {
      const end = start + CHUNK_SIZE * 4; // 1 token ≈ 4 tecken
      const chunkText = text.slice(start, end);

      const chunkEmbedding: number[] = await this.llm.embed(chunkText); 

      chunks.push({
        id: `${docId}-${index++}`,
        docId,
        text: chunkText,
        embedding: chunkEmbedding, // 
        sourceRef: {
          documentName: docId,
          page: 1, // placeholder for now
          offset: start,
        },
      });

      if (chunks.length > MAX_CHUNKS) {
        console.warn(
          `High amount of Chunks!: ${chunks.length} chunks for document ${docId}`,
        );
        break;
      }

      // Move sliding window forward with overlap
      start += (CHUNK_SIZE - OVERLAP) * 4;
    }

    // Store all chunks in vector store
    await this.vectorStore.upsert(docId, chunks);
  }
}
