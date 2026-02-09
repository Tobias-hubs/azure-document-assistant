import express from "express";
import cors from "cors";
import { SearchController } from "./controllers/searchControllers";
import { RagService } from "./services/ragService";
import { MockVectorStore } from "./adapters/mockVectorStore";
import { MockLLMClient } from "./adapters/mockLLMClient"; // comment out to test ai 
import { OpenAILLMClient } from "./adapters/openaiLLMClient" 
import { MockLogger } from "./utils/logger";
import ingestRoutes from "./routes/ingestRoutes";
import path from "path";
import dotenv from "dotenv"; 

dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", ingestRoutes);

app.use(
  "/documents",
  express.static(path.join(__dirname, "..", "documents"))
);

const vectorStore = new MockVectorStore();
const llmClient = new MockLLMClient();  // TODO comment out to test ai 
// const llmClient = new OpenAILLMClient(); 
const logger = new MockLogger();

const ragService = new RagService(vectorStore, llmClient, logger);

const searchController = new SearchController(ragService);

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("Internal Document Assistant API is running");
});

app.post("/api/search", async (req: express.Request, res: express.Response) => {
    try {
        const { query, docId } = req.body;

        if (!query || !docId) {
            return res.status(400).json({ error: "query och docId krävs" });
        }

        const result = await searchController.search(query, docId);
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
