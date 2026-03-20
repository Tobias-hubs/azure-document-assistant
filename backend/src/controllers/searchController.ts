/* Text search & Vision search */

import OpenAI from "openai";
import { RagService } from "../services/rag/RagService";
import { AnswerDTO } from "../models/types";

import * as fs from "fs/promises";
import { renderPdf } from "../services/pdf/renderPdf";


import { execFile } from "child_process";
import { promisify } from "util";
const exec = promisify(execFile);


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

    const withOrig = answer.sources.find(s => typeof s?.attributes?.origFileId === "string");
    if (!fileId && withOrig) fileId = (withOrig as any).attributes.origFileId; 

    const withAttr = answer.sources.find((s: any) => typeof s?.attributes?.origFileId === "string");
    if (!fileId && withAttr) fileId = (withAttr as any).attributes.origFileId;

    const src = answer.sources.find(s => s.fileId === fileId && s?.attributes?.storagePath);

    
    // If user mentions visuals or a page number - vision runs (only if PDF localy stored)
    const mentionsVisuals = /\b(bild|bilder|bilden|figur|diagram|illustration|foto|image|picture|figure|icon|ikon|graf|grafik|överst|topp(en)?|första\s+ordet|syns|ser\s+du|föreställer)\b/i.test(query);
    
    const shouldRenderVision = (Boolean(page) || mentionsVisuals) && 
    Boolean(src?.attributes?.storagePath);

    if (!shouldRenderVision) {
      return { answer: answer.text, sources: answer.sources };
    }
  
    // To not get mixed answers from RAG-text & Vision
    answer.text = ""; // VISION This is only temporary 

    const pdfPath = src!.attributes!.storagePath; 
   
    // Auto detect page with image for visual questions
    let targetPage = page; 

    if (!targetPage && mentionsVisuals) { 
      try {
      const pagesWithImages = await findPagesWithImages(pdfPath);
      targetPage = pagesWithImages[0] ?? 1;
    } catch (err) { 
      console.warn("[Search] page finder failed", err);
      targetPage = 1;
    }
  }
    // Run vision 
    let imageBase64: string | null = null; 
    let caption: string | null = null; 

    try { 
      // Read pdf & render relevant page
      const pdfBuffer = await fs.readFile(pdfPath);
      imageBase64 = await renderPdf(pdfBuffer, targetPage!); 

      if (imageBase64) { 
       // VISION Send image to vision Responses API openAI 
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
                text: `Vad är detta för bild på sida ${targetPage}? Var tydlig och kort.`
              }
            ]
          }
        ]
       })
       // VISION > Azure Vision + tweaks in endpoint (index.ts) 
       /* 
       
const azureVisionResponse = await azureVisionClient.analyzeImage({
    url: `data:image/png;base64,${imageBase64}`,
    features: ["caption"]
});
const caption = azureVisionResponse.caption;

       */
   
    caption = 
    (visionResponse as any).output_text ?? 
    (visionResponse as any).output?.[0]?.content?.[0]?.text ?? 
    null;
      } 
    } catch (err) {
      console.error("[Search] Vision Error, fallback to text-only answer:", err);
    }

    
  const finalAnswer = imageBase64
    ? caption && caption.trim()
      ? caption
      : "Jag kunde tyvärr inte tolka bilden."
    : answer.text && answer.text.trim()
      ? answer.text
      : "Jag kunde tyvärr inte hitta ett textbaserat svar.";

  return {
    answer: finalAnswer,
    sources: answer.sources,
    ...(imageBase64
      ? {
          vision: {
            page: targetPage!,
            fileId,
            imageBase64,
            caption,
          },
        }
      : {}),
  };


    // VISION Temporary disabled untill pipelines have been splitup
    // return { 
    //   answer: answer.text,
    //   sources: answer.sources,
    //   ...(imageBase64 ? { 
      
    //   vision: { 
    //     page: targetPage!,  
    //     fileId, 
    //     imageBase64,
    //     caption 
    //   } 
    // } : {})
    // }; 
  }
}

// Helper function to find pages with images 
async function findPagesWithImages(pdfPath: string): Promise<number[]> { 
  const { stdout } = await exec("pdfimages", ["-list", pdfPath]);
  const pages = new Set<number>();
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.trim().match(/^(\d+)\s+/); 
    if (m && m[1] !== undefined) {
      pages.add(parseInt(m[1], 10));
    }
  }
  return [...pages].sort((a, b) => a - b);
}