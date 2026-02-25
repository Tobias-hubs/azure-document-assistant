import { db } from "../db/database"; 

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

export const documentRepository = { 
    create: ( 
        docId: string, 
        fileId: string, 
        vectorStoreId: string, 
        filename: string, 
        vectorStoreFileId?: string, 
        contentHash?: string
    ) => { 
        // questionmarks protects against SQL injection
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