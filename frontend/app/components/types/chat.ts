
export type Message = {
  // id: string; 
    sender: "user" | "ai";
  text: string;
  sources?: { documentName: string; page: number }[];
};
