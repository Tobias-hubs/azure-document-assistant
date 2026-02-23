import { Router } from "express";
import { upload } from "../middleware/upload";
import { IngestController } from "../controllers/IngestController";
import { HostedIngestService } from "../services/HostedIngestService";

export function createIngestRoutes(
    ingestService: HostedIngestService
) {  
const router = Router(); 



const controller = new IngestController(ingestService); 

router.post(
    "/ingest",
    upload.single("file"), 
    controller.ingest
);

router.delete(
    "/api/ingest/:docId", 
    controller.delete);


return router; 
}