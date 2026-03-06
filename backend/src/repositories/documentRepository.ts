import { db } from "../db/database"; 
// SQL 4  Local storage after ingestion, - documents.db
export interface DocumentRecord  { 
    id: string; 
    file_id: string; 
    vector_store_id: string; 
    vector_store_file_id: string; // For deletion in vector store, not in files table
    content_hash?: string; // For deduplication based on file content hash (optional)
    is_deleted?: number; // Soft delete flag (0 = active, 1 = deleted)
    deleted_at?: string;  // Timestamp of deletion (optional)
    filename: string; 
    created_at: string; 
}
// create, read, update, and delete (CRUD) are the four basic operations (actions) of persistent storage.
export const documentRepository = { 
    create: ( 
        docId: string, 
        fileId: string, 
        vectorStoreId: string, 
        filename: string, 
        vectorStoreFileId?: string, 
        contentHash?: string
    ) => { 
        // Parameter binding (`?`) prevents SQL injection by separating data from SQL code.
        const stmt = db.prepare(`
            INSERT INTO documents (id, file_id, vector_store_id, filename, vector_store_file_id, content_hash)
            VALUES (?, ?, ?, ?, ?, ?) 
            `); 
            stmt.run(docId, fileId, vectorStoreId, filename, vectorStoreFileId ?? null, contentHash ?? null); // Run statement
    }, 

    findById: (docId: string): DocumentRecord | undefined => { 
        const stmt = db.prepare(`
            SELECT * FROM documents WHERE id = ? 
            `); 

            return stmt.get(docId) as DocumentRecord | undefined; 
    }, 

    // TODO Add documentRepository.list() to get all documents for a user in UI,

    findByHash: (contentHash: string): DocumentRecord | undefined => { 
        const stmt = db.prepare(`
            SELECT * FROM documents WHERE content_hash = ? AND (is_deleted IS NULL OR is_deleted = 0)
            `);

        return stmt.get(contentHash) as DocumentRecord | undefined; 
    }, 

    delete: (docId: string) => { 
        const stmt = db.prepare(`
            DELETE FROM documents WHERE ID = ? 
            `); 

            stmt.run(docId); 
    }, 

    // Optional soft delete method
    softDelete: (docId: string) => { 
        const stmt = db.prepare(`
            UPDATE documents SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ? 
            `);
            stmt.run(docId); 
        }
}; 