export type SourceRef = { documentName: string; page: number; offset: number };
export type Answer = { text: string; sources: SourceRef[] };
export type AnswerDTO = { answer: string; sources: SourceRef[] };
