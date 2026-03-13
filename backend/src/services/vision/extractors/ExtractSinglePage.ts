
import OpenAI from "openai";



export async function extractOnePageImageBase64( 
    client: OpenAI, 
    fileId: string, 
    page: number, 
): Promise<string | null> {

    if (!fileId || !page || page < 1) return null;

    // const fileContent = await client.files.content(fileId);
    // const arrayBuffer = await fileContent.arrayBuffer();
    // const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");
    
const file = await client.files.retrieve(fileId);

// Hämta binära data via fetch manuellt
const downloadUrl = `https://api.openai.com/v1/files/${fileId}/content`;

const pdfResponse = await fetch(downloadUrl, {
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
  }
});

if (!pdfResponse.ok) {
  console.error("Failed to download PDF:", await pdfResponse.text());
  throw new Error(`Could not download PDF for fileId: ${fileId}`);
}

const arrayBuffer = await pdfResponse.arrayBuffer();
const pdfBase64 = Buffer.from(arrayBuffer).toString("base64");


    const url = process.env.RENDER_SERVICE_URL || "http://localhost:7070";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try { 
        const response = await fetch(`${url}/render`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfBase64, page }),
            signal: controller.signal
        });

        if (!response.ok) { 
            let bodyText = "";
            try {
                bodyText = await response.text();
            } catch {} 
            console.error(`Render service error: ${response.status} ${response.statusText}. Body: ${bodyText}`);
            return null;
        }

        const data = await response.json().catch(() => null);
        const imageBase64 = data?.imageBase64;

        return typeof imageBase64 === "string" && imageBase64.length > 0 ? imageBase64 : null; 
    } catch (err) {
        console.error("Render call failed:", err);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}