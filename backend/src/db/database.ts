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

    db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    doc_id TEXT NOT NULL, 
    sender TEXT NOT NULL, 
    text TEXT NOT NULL, 
    created_at INTEGER NOT NULL 
    ); 
    CREATE INDEX IF NOT EXISTS idx_chat_user_doc ON chat_messages(user_name, doc_id);
    `);

    function addColumnIfMissing(table: string, column: string, type: string) {
        const row = db.prepare(`PRAGMA table_info(${table})`).all(); 
        const existingColumn = row.find((c: any) => c.name === column);
        if (!existingColumn) { 
            db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
            console.log(`Added missing column '${column}' to '${table}' table.`);

        }
    } 

    // Dedupe + delete 
   addColumnIfMissing("documents", "vector_store_file_id", "TEXT"); // delete in vector store, not in files table

   addColumnIfMissing("documents", "content_hash", "TEXT"); // For deduplication based on file content hash (optional)
   addColumnIfMissing("documents", "is_deleted", "INTEGER DEFAULT 0"); // Soft delete flag (0 = active, 1 = deleted)
   addColumnIfMissing("documents", "deleted_at", "TEXT");  // Timestamp of deletion (optional)
   

