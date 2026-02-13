import multer from "multer"; 

const storage = multer.memoryStorage(); // INGEST store file in RAM 

export const upload = multer ({ storage }); 