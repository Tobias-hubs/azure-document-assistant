/* This script was necessary to clean up the vector store and global files after testing, 
 since the SDK doesn't automatically delete the global file when you delete the vector store association. You can run this with `npm run cleanup-vs` from the backend folder.

 */
import OpenAI from "openai";
import "dotenv/config";

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const vsId = process.env.OPENAI_VECTOR_STORE_ID;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in .env");
  }

  if (!vsId) {
    throw new Error("Missing OPENAI_VECTOR_STORE_ID in .env");
  }

  const client = new OpenAI({ apiKey });

  console.log("Cleaning up Vector Store:", vsId);
  console.log("--------------------------------------------------");

  // 1. Hämta alla filer i vector store
  const list = await client.vectorStores.files.list(vsId);

  console.log(`Found ${list.data.length} files in vector store.`);

  if (list.data.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  // 2. Ta bort varje association + global fil
  for (const f of list.data) {
    const associationId = f.id;
    
    // global file id kan vara f.file_id eller f.id beroende på SDK-version
    const globalFileId = (f as any).file_id ?? f.id;

    console.log("Deleting vector store association:", associationId);

    try {
      await client.vectorStores.files.delete(
        associationId,
        { vector_store_id: vsId }
      );
      console.log("Deleted association:", associationId);
    } catch (err: any) {
      console.error("Failed to delete association:", associationId, err.message);
    }

    // 3. Ta bort global fil
    console.log("Deleting global file:", globalFileId);

    try {
      await client.files.delete(globalFileId);
      console.log("✓ Deleted file:", globalFileId);
    } catch (err: any) {
      console.error("Failed to delete file:", globalFileId, err.message);
    }
  }

  console.log("--------------------------------------------------");
  console.log("Vector store + global file cleanup complete.");
}

main().catch(err => {
  console.error("Cleanup error:", err);
});