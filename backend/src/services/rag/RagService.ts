import { Answer } from "../../models/types";

export interface RagService { 
    answer(question: string, docId: string): Promise<Answer>;
    
}