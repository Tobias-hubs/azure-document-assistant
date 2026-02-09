// import fs from "fs";
// import path from "path";
import { PdfService } from "./pdfService";
import { VectorStoreAdapter } from "../adapters/vectorStore";
import { Chunk } from "../models/types";

export class DocumentIngestService {
  constructor(
    private pdfService: PdfService,
    private vectorStore: VectorStoreAdapter,
  ) {}

  async ingestBuffer(buffer: Buffer, docId: string): Promise<void> {
    // const absolutePath = path.resolve(filePath);
    // const buffer = fs.readFileSync(absolutePath);
    // const text = await this.pdfService.extractText(buffer);
    const text = await this.pdfService.extractText(buffer);

    const CHUNK_SIZE = 900;
    const OVERLAP = 100;
    const MAX_CHUNKS = 2000;

    const chunks: Chunk[] = [];

    let start = 0;
    let index = 0;

    const approxTokens = Math.ceil(text.length / 4);

    console.log({
      approxTokens,
      estimatedChunks: Math.ceil(approxTokens / (CHUNK_SIZE - OVERLAP)),
    });

    while (start < text.length) {
      const end = start + CHUNK_SIZE * 4; // 1 token ≈ 4 tecken
      const chunkText = text.slice(start, end);

      chunks.push({
        id: `${docId}-${index++}`,
        docId,
        text: chunkText,
        embedding: [],
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

      start += (CHUNK_SIZE - OVERLAP) * 4;
    }

    await this.vectorStore.upsert(docId, chunks);
  }
}
