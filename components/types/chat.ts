
export type SourceRef = {
  id: string; 
  title?: string; 
  filename?: string; 
  blobUrl?: string;
  snippet?: string;  
};

export type VisionRef = { 
  blobUrl?: string; 
  caption?: string; 
}; 

export type Message = {
  sender: "user" | "ai";
  text: string;
  context?: SourceRef[]; // Result from Azure Search
  vision?: VisionRef[]; 
  imageUrl?: string;
};

