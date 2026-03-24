


export type SourceRef = {
  documentName: string;
  page: number;
  offset: number;
  fileId?: string | null;
  chunkId?: string | null;
  attributes?: Record<string, any>;
};

export type Message = {
  // id: string; 
    sender: "user" | "ai";
  text: string;
  sources?: SourceRef[];
  vision?: { page: number; fileId: string; imageBase64: string; caption: string };
};

