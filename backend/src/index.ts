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


dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY!,
}); 

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

const searchController = new SearchController(ragService);

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("Internal Document Assistant API is running");
});

// SEARCH 2 (frontend initiates the search) 
app.post("/api/search", async (req: express.Request, res: express.Response) => {
    try {
        const { query, vectorStoreId, userId } = req.body;

        if (!query || !vectorStoreId) {
            return res.status(400).json({ error: "query och vectorStoreId krävs" });
        }

    
       const result = await searchController.search(query, vectorStoreId, userId);
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
