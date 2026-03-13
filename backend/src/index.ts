import express from "express";
import cors from "cors";
import dotenv from "dotenv"; 
import OpenAi, { OpenAI } from "openai"; 

import { SearchController } from "./controllers/searchController";
import { Logger } from "./utils/logger";
import { HostedRagService } from "./services/rag/HostedRagService"; 
import { HostedIngestService } from "./services/HostedIngestService";
import { createIngestRoutes } from "./routes/ingestRoutes";
import { createDocumentRoutes } from "./routes/documentRoutes";
import { OpenAIVisionAdapter } from "./services/vision/OpenAiVisionAdapter";


dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY!,
}); 

const vision = new OpenAIVisionAdapter(openai);

app.get("/api/vector-stores", async (req, res) => {
    try { 
const stores = [
     { id: process.env.OPENAI_VECTOR_STORE_ID!, name: "Förvald kunskapsbas" }, ];
res.json(stores);
    } catch (error) {
        console.error("Error fetching vector stores:", error);
        res.status(500).json({ error: "Internt serverfel" });
    }
    });

    const defaultVectorStoreId = process.env.OPENAI_VECTOR_STORE_ID!;
if (!defaultVectorStoreId) {
    throw new Error("OpenAI vector store id missing");
}

const ragService = new HostedRagService(openai, defaultVectorStoreId);
const ingestService = new HostedIngestService(openai, defaultVectorStoreId);


app.use("/api", createIngestRoutes(ingestService));

app.use("/api", createDocumentRoutes(openai, defaultVectorStoreId));


const logger = new Logger();

const searchController = new SearchController(ragService, openai, vision);

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("Internal Document Assistant API is running");
});

// SEARCH 2 (frontend initiates the search) 
app.post("/api/search", async (req: express.Request, res: express.Response) => {
    try {
        const { query, vectorStoreId, userId } = req.body;

        
    console.log("[/api/search] CLIENT sent vectorStoreId:", vectorStoreId);
    console.log("[/api/search] ENV vectorStoreId:", process.env.OPENAI_VECTOR_STORE_ID)


        if (!query) {
            return res.status(400).json({ error: "query krävs" });
        }

    const resolvedVectorStoreId = process.env.OPENAI_VECTOR_STORE_ID!;
    console.log("[/api/search] Resolved vectorStoreId:", resolvedVectorStoreId);
       const result = await searchController.search(query, resolvedVectorStoreId, userId);

        res.json(result);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Internt serverfel" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`API server is running on port ${PORT}`);
});
