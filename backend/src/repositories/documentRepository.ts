import { db } from "../db/database"; 

export interface DocumentRecord  { 
    id: string; 
    file_id: string; 
    vector_store_id: string; 
    filename: string; 
    created_at: string; 
}

export const documentRepository = { 
    create: ( 
        docId: string, 
        fileId: string, 
        vectorStoreId: string, 
        filename: string
    ) => { 
        // questionmarks protects against SQL injection
        const stmt = db.prepare(`
            INSERT INTO documents (id, file_id, vector_store_id, filename)
            VALUES (?, ?, ?, ?,) 
            `); 
            stmt.run(docId, fileId, vectorStoreId, filename); // Run statement
    }, 

    findById: (docId: string): DocumentRecord | undefined => { 
        const stmt = db.prepare(`
            SELECT * FROM documents WHERE id = ? 
            `); 

            return stmt.get(docId) as DocumentRecord | undefined; 
    }, 

    delete: (docId: string) => { 
        const stmt = db.prepare(`
            DELETE FROM documents WHERE ID = ? 
            `); 

            stmt.run(docId); 
    }
}; 