import OpenAI from "openai";
import { Answer } from "../../models/types";
import { RagService } from "./RagService"; 

export class HostedRagService implements RagService {
  constructor(
    private client: OpenAI,
    private vectorStoreId: string
  ) {}

  async answer(question: string): Promise<Answer> {
    const response = await this.client.responses.create({
      model: "gpt-4o-mini", // gpt 5? 
      input: question,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [this.vectorStoreId],
        },
      ],
    });

    let text = "";
    const sources: any[] = []; // TODO Any is not desirable

    for (const item of response.output ?? []) {
      if (item.type !== "message") continue;

      for (const content of item.content ?? []) {
        if (content.type !== "output_text") continue;

        text += content.text + "\n";

        const citations =
          content.annotations?.filter(
            (a): a is any => a.type === "file_citation" // TODO Any is not desirable 
          ) ?? [];

        for (const c of citations) {
          sources.push({
            documentName: c.filename,
            page: 0,
            offset: 0,
          });
        }
      }
    }

    return {
      text: text.trim(),
      sources,
    };
  }
}
