import OpenAI from "openai";
import { RagService } from "../services/rag/RagService";
import { AnswerDTO } from "../models/types";

import * as fs from "fs/promises";
import { renderPdf } from "../services/pdf/renderPdf";

// SEARCH 3 routes the search request from frontend to RagService, and maps the response to a DTO for frontend to comprehend.
export class SearchController {
  constructor(
    private rag: RagService,
    private openai: OpenAI,
  ) {}

  async search(query: string, vectorStoreId?: string, userId?: string): Promise<AnswerDTO> {
   
    if (!query || typeof query !== "string") {
      return { answer: "", sources: [] };
    }
   
    if (!vectorStoreId) {
      throw new Error("VectorStoreId must be provided for search");
    }

    const answer = await this.rag.answer(query, vectorStoreId);
    console.log("[Search] query:", query);
    console.log("[Search] sources: ", JSON.stringify(answer.sources, null, 2));

    const m = query.match(/\b(?:sida|page)\s+(\d{1,4})\b/i);
    const page: number | null= m?.[1] ? parseInt(m[1], 10) : null;
    console.log("[Search] detected page:", page);

    let fileId: string | null = null; 

    const withFile = answer.sources.find((s: any) => typeof s?.fileId === "string"); 
    if (withFile) fileId = (withFile as any).fileId; 

    const withOrig = answer.sources.find(s => s?.attributes?.storagePath);
    if (!fileId && withOrig) fileId = (withOrig as any).attributes.origFileId; 

    const withAttr = answer.sources.find((s: any) => typeof s?.attributes?.origFileId === "string");
    if (!fileId && withAttr) fileId = (withAttr as any).attributes.origFileId;

    const src = answer.sources.find(s => s?.attributes?.storagePath);

    const mentionsVisuals = /\b(bild|figur|diagram|illustration|image|figure|överst|första ordet)\b/i.test(query);
    const shouldRenderVision = (Boolean(page) || mentionsVisuals) && 
    Boolean(src?.attributes?.storagePath);

    if (!shouldRenderVision) {
      return { answer: answer.text, sources: answer.sources };
    }
    
    let imageBase64: string | null = null; 
    let caption: string | null = null; 

    try { 
      const pdfBuffer = await fs.readFile(src!.attributes!.storagePath);
      imageBase64 = await renderPdf(pdfBuffer, page ?? 1); 

      if (imageBase64) { 
       // Send image to vision Responses API
       const visionResponse = await this.openai.responses.create({ 
        model: "gpt-4o-mini", 
        input: [ 
          { 
            role: "user", 
            content: [ 
              { 
                type: "input_image",
                image_url: `data:image/png;base64,${imageBase64}`,
                detail: "high",
              },
              { 
                type: "input_text",
                text: `Vad är detta för bild på sida ${page}? Var tydlig och kort.`
              }
            ]
          }
        ]
       })
   
    caption = 
    (visionResponse as any).output_text ?? 
    (visionResponse as any).output?.[0]?.content?.[0]?.text ?? 
    null;
      } 
    } catch (err) {
      console.error("[Search] Vision Error, fallback to text-only answer:", err);
    }

    return { 
      answer: answer.text,
      sources: answer.sources,
      ...(imageBase64 ? { 
      
      vision: { 
        page,  
        fileId, 
        imageBase64,
        caption 
      } 
    } : {})
    }; 
  }
}