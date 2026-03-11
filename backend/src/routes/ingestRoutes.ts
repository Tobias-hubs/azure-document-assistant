import { Router } from "express";
import { upload } from "../middleware/upload";
import { IngestController } from "../controllers/IngestController";
import { HostedIngestService } from "../services/HostedIngestService";

export function createIngestRoutes(ingestService: HostedIngestService) {  
const router = Router(); 
const controller = new IngestController(ingestService); 

router.post(
    "/ingest",
    upload.single("file"), // INGEST 1.5 middleware to handle file upload (multer) 
    controller.ingest
);

router.delete(
    "/ingest/:fileId/:vectorStoreFileId", 
    controller.delete);


return router; 
}