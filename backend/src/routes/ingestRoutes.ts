import { Router } from "express";
import { upload } from "../middleware/upload";
import { IngestController } from "../controllers/ingestController";
import { DocumentIngestService } from "../services/documentIngestService";
import { PdfService } from "../services/pdfService";
import { InMemoryVectorStore } from "../adapters/InMemoryVectorStore";

export function createIngestRoutes(ingestService: DocumentIngestService) {  
const router = Router(); 



const controller = new IngestController(ingestService); 

router.post(
    "/ingest",
    upload.single("file"),
    controller.ingest
);

return router; 
}