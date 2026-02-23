import Database, { Database as DatabaseType} from "better-sqlite3"; 
import path from "path"; 

const dbPath = path.join(process.cwd(), "documents.db"); 

export const db: DatabaseType = new Database(dbPath); 

db.exec(`
    CREATE TABLE IF NOT EXISTS documents ( 
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    vector_store_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `);