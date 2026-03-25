import { BlobServiceClient } from "@azure/storage-blob";


export async function POST(req: Request) {
  
  try { 
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) { 
    return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
  }
  // Read file into buffer
  const buffer = Buffer.from(await file.arrayBuffer()); // Stream instead of Buffer? 

  // Initialize Blob Service Client
  const blobService = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );

  // Get a reference to the container
  const container = blobService.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME!);
  await container.createIfNotExists();  

  const blobName = `${Date.now()}-${file.name}`; //NOTE: change to UUID`?? 
  const blobClient = container.getBlockBlobClient(blobName);

  

  await blobClient.uploadData(buffer); 

  return Response.json({ 
    filename: file.name, 
    blobUrl: blobClient.url,
  }); 

  
   } catch (err: any) {
  console.error("Upload error:", err);
 
  return new Response(
    JSON.stringify({ error: "Upload failed:"}), 
    { status: 500 }
    );
   }
  }
