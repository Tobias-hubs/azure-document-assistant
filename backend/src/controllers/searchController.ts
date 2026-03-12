import OpenAI from "openai";
import { VisionAdapter } from "../services/vision/VisionAdapter";
import { extractOnePageImageBase64 } from "../services/vision/extractors/ExtractSinglePage";
import { RagService } from "../services/rag/RagService";
import { AnswerDTO } from "../models/types";

// SEARCH 3 routes the search request from frontend to RagService, and maps the response to a DTO for frontend to comprehend.
export class SearchController {
  constructor(
    private rag: RagService,
    private openai: OpenAI,
    private vision: VisionAdapter
  ) {}

  async search(query: string, vectorStoreId?: string, userId?: string): Promise<AnswerDTO> {
   
    if (!query || typeof query !== "string") {
      return { answer: "", sources: [] };
    }
   
    if (!vectorStoreId) {
      throw new Error("VectorStoreId must be provided for search");
    }

    const answer = await this.rag.answer(query, vectorStoreId);

    const m = query.match(/\b(?:sida|page)\s+(\d{1,4})\b/i);
    const page = m?.[1] ? parseInt(m[1], 10) : null;

    if (!page) { 

    return { answer: answer.text, sources: answer.sources }; // Internaly map Answer to AnswerDTO for frontend: 
    // 'text' from Answer becomes 'answer' in DTO, 'sources' copied as-is
    }

    let fileId: string | null = null;

    if (Array.isArray(answer.sources)) { 
      const withFile = answer.sources.find((s: any) => typeof s?.fileId === "string");
      if (withFile) fileId = (withFile as any).fileId;

      if (!fileId) { 
        const withAttr = answer.sources.find((s: any) => typeof s?.attributes?.origFileId === "string");
        if (withAttr) fileId = (withAttr as any).attributes.origFileId;
      }
    }
   
    // Fallback: take first file in store
    if (!fileId) { 
      const list = await this.openai.vectorStores.files.list(vectorStoreId); 

      const first = list.data?.[0] as any; 
      if (first) { 
        fileId = first.file_id ?? first.file_ids?.[0] ?? null; 
      }

    }
    if (!fileId) {

      return { answer: answer.text, sources: answer.sources };
    }

    const imageBase64 = await extractOnePageImageBase64(this.openai, fileId, page);
    if (!imageBase64) {
      return { answer: answer.text, sources: answer.sources };
    }

    const caption = await this.vision?.annotateImage(imageBase64);

    return { 
      answer: answer.text, 
      sources: answer.sources,

      vision: { 
        page, 
        fileId, 
        imageBase64,
        caption 

      } 
    }; 
  }
}
