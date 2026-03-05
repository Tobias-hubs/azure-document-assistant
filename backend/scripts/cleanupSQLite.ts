// backend/scripts/cleanupSQLite.ts
import "dotenv/config";
import OpenAI from "openai";
import { db } from "../src/db/database";

type DocumentRecord = {
  id: string;
  file_id: string;
  vector_store_id: string;
  vector_store_file_id: string; 
  content_hash?: string;
  is_deleted?: number;
  deleted_at?: string;
  filename: string;
  created_at: string;
};

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const vsId = process.env.OPENAI_VECTOR_STORE_ID;

  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  if (!vsId) throw new Error("Missing OPENAI_VECTOR_STORE_ID");

  const client = new OpenAI({ apiKey });

  console.log("Reading vector store:", vsId);
  const list = await client.vectorStores.files.list(vsId);

  const liveIds = new Set(list.data.map((f: any) => f.id));

  console.log(`Live entries in VS: ${liveIds.size}`);

  // Hämta alla docs i SQLite
  const docs = db.prepare("SELECT * FROM documents").all() as DocumentRecord[];

  let removed = 0;
  for (const doc of docs) {
    if (!liveIds.has(doc.vector_store_file_id)) {
      console.log(" Removing orphan DB row:", {                 
        docId: doc.id,
        vsFileId: doc.vector_store_file_id,
        fileId: doc.file_id,
      });   
      
      // Delete chat_messages  // NOTE VACUUM;is needed to actually free space after deletion
      const cutoff = Date.now() - 20 * 24 * 60 * 60 * 1000; // 20 days in ms
      db.prepare(`
        DELETE FROM chat_messages 
        WHERE created_at < ?
      `).run(cutoff);     

      db.prepare("DELETE FROM documents WHERE id = ?").run(doc.id); 
      removed++;
    }
  }

  console.log(`SQLite cleanup complete. Removed ${removed} rows.`);
}

main().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});