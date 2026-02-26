import { Answer } from "../../models/types";

export interface RagService { 
    answer(question: string, docId?: string, vectorStoreId?: string): Promise<Answer>;
    
}