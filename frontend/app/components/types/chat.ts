
export type Message = {
  // id: string; 
    sender: "user" | "ai";
  text: string;
  sources?: { documentName: string; page: number }[];
  vision?: { page: number; fileId: string; imageBase64: string; caption: string };
};
