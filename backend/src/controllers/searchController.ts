import { RagService } from "../services/rag/RagService";
import { AnswerDTO } from "../models/types";

// SEARCH 3 mainly routes the search request from frontend to RagService, and maps the response to a DTO for frontend to comprehend.
export class SearchController {
  constructor(private rag: RagService) {}

  async search(query: string, docId?: string, vectorStoreId?: string, userId?: string): Promise<AnswerDTO> {
    if (!docId && !vectorStoreId) {
      throw new Error("Either docId or vectorStoreId must be provided for search");
    }

    const answer = await this.rag.answer(query, docId, vectorStoreId);

    return { answer: answer.text, sources: answer.sources };
    // Internaly map Answer to AnswerDTO for frontend: 
    // 'text' from Answer becomes 'answer' in DTO, 'sources' copied as-is
  }
}
