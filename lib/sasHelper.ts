import { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

const credential = new StorageSharedKeyCredential(
    process.env.AZURE_ACCOUNT_NAME!, 
    process.env.AZURE_ACCOUNT_KEY!
);


export function getBlobSasUrl(container: string, blobName: string) { 
    const expiresOn = new Date(Date.now() + 10 * 60 * 1000); 

    const sasToken = generateBlobSASQueryParameters( 
        { 
            containerName: container, 
            blobName, 
            permissions: BlobSASPermissions.parse("r"), // Read-only access
            expiresOn, 
        }, 
        credential
    ).toString();

    return`https://${process.env.AZURE_ACCOUNT_NAME}.blob.core.windows.net/${container}/${blobName}?${sasToken}`;
} 