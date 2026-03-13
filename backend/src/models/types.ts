export type SourceRef = { documentName: string; page: number; offset: number; fileId?: string | null; chunkId? : string | null; attributes?: Record<string, any> };
export type Answer = { text: string; sources: SourceRef[] };
export type AnswerDTO = { answer: string; sources: SourceRef[]; 
    vision?: { page: number; fileId: string; imageBase64: string; caption: string 
}; };
