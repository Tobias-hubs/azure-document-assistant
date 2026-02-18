import { RagService } from "../services/rag/LocalRagService";
import { AnswerDTO } from "../models/types";

export class SearchController {
  constructor(private rag: RagService) {}

  // SEARCH 3 - Forward query + docId into Rag answer pipeline
  async search(query: string, docId: string, userId: string): Promise<AnswerDTO> {
    const answer = await this.rag.answer(query, docId,);
    // SEARCH 8 Return answer + source references back to client
    return { answer: answer.text, sources: answer.sources };
    // Internaly map Answer to AnswerDTO for frontend: 
    // 'text' from Answer becomes 'answer' in DTO, 'sources' copied as-is
  }
}
