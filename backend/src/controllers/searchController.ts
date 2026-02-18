import { RagService } from "../services/rag/RagService";
import { AnswerDTO } from "../models/types";

export class SearchController {
  constructor(private rag: RagService) {}

  async search(query: string, docId: string, userId: string): Promise<AnswerDTO> {
    const answer = await this.rag.answer(query, docId);

    return { answer: answer.text, sources: answer.sources };
    // Internaly map Answer to AnswerDTO for frontend: 
    // 'text' from Answer becomes 'answer' in DTO, 'sources' copied as-is
  }
}
