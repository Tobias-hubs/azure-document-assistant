import express from "express";
import cors from "cors";
import dotenv from "dotenv"; 
import OpenAi, { OpenAI } from "openai"; 

import { SearchController } from "./controllers/searchController";
import { Logger } from "./utils/logger";
import { HostedRagService } from "./services/rag/HostedRagService"; 
import { HostedIngestService } from "./services/HostedIngestService";
import { createIngestRoutes } from "./routes/ingestRoutes";
import { db } from "./db/database";

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
     { id: process.env.OPENAI_VECTOR_STORE_ID!, name: "Default knowledge base" }, ];
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


// const ragService = new HostedRagService( 
//     openai, 
//     vectorStoreId
// );

// const ingestService = new HostedIngestService( 
//     openai, 
//     vectorStoreId
// );

app.use("/api", createIngestRoutes(ingestService));


const logger = new Logger();

const searchController = new SearchController(ragService);

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("Internal Document Assistant API is running");
});

app.get("/api/chat/history", (req, res ) => {
    const { userName, docId } = req.query;
    if (!userName || !docId) {
        return res.status(400).json({ error: "userName och docId krävs" });
    }
    const rows = db.prepare(`
        SELECT sender, text FROM chat_messages
        WHERE user_name = ? AND doc_id = ?
        ORDER BY created_at ASC
    `).all(userName, docId);
    res.json(rows);
});

app.post("/api/chat", (req, res) => {
    const { username, docId, sender, text } = req.body;
    db.prepare(` 
        INSERT INTO chat_messages (id, user_name, doc_id, sender, text, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(
        crypto.randomUUID(),
        username,
        docId,
        sender,
        text,
        Date.now()
    );
    res.json({ ok: true });
});

app.post("/api/search", async (req: express.Request, res: express.Response) => {
    try {
        const { query, docId, vectorStoreId, userId } = req.body;

        if (!query || (!docId && !vectorStoreId)) {
            return res.status(400).json({ error: "query och docId eller vectorStoreId krävs" });
        }

    
       const result = await searchController.search(query, docId, vectorStoreId, userId);
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
