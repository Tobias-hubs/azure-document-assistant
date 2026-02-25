/* */
import toast from "react-hot-toast";
import { useState } from "react";

type UploadResult = { 
    docId: string; 
    displayName: string; 
}; 

type ApiDuplicateResponse = { 
    error: "duplicate";
    message: string; 
    docId: string; 
    displayName: string; 
}; 

type UploadButtonProps = { 
    onUploadSuccess?: (data: UploadResult) => void;
};

export function UploadButton({ onUploadSuccess }: UploadButtonProps) { 

    const [loading, setLoading] = useState(false);

const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
   // <input type="file"> gives a File object. 
    const file = e.target.files?.[0]; // INGEST 1 First initiation upload file
    if (!file) return; 

    setLoading(true);

    try { 
    // Create a multipart/form-data payload
    // Form data allows to send binary files in an HTTP POST request.
    const formData = new FormData(); 

    // Append the actual PDF file (binary )
    formData.append("file", file);  // Multer expects formData.append("file", <the pdf>);
    
    // Send PDF to backend /api/ingest
    // Backend uses Multer's upload.singe("file") to read as req.file
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingest`, {
        method: "POST", 
        body: formData, 
    });

    // Handle duplicate error (409 Conflict)
    if (res.status === 409) {
        const duplicateData: ApiDuplicateResponse = await res.json();
        
        toast.custom((t) => ( 
            <div className="max-w-sm w-full rounded-md bg-white shadow border p-4">
            <div className="font-medium text-gray-900">Dokumentet finns redan</div>
            <div className="text-sm text-gray-600 mt-1">
              '{duplicateData.displayName}' är redan uppladdat.
            </div>
            <div className="flex gap-2 mt-3">
              
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                onClick={() => {
                    onUploadSuccess?.({ 
                        docId: duplicateData.docId,
                        displayName: duplicateData.displayName,
                    });
                    toast.dismiss(t.id);
                }}
                > 
                Använd befintligt dokument 
                </button>

                <button
                className="px-3 py-1 rounded border border-gray-300 text-red-200 "
                onClick={() => {
                    // Do nothing
                    toast.dismiss(t.id); 
                }}
                > 
                Avbryt
                </button>

            </div>
            </div> 
        ), { duration: 9000 }); // Show for 9 seconds

        e.target.value = ""; // Reset file input

        return; // Stop further processing
            }

    if (!res.ok) { 
        toast.error(`Upload failed with status ${res.status}).`); 
        e.target.value = ""; // Reset file input
        return; 
    }

   
    // Parse backend response & runtime check
    const raw = await res.json(); 
    if (!raw.docId || !raw.displayName) { 
        throw new Error("Invalid response from server"); 
    } 
    
    const data: UploadResult = raw;
    

    // Notify user
    toast.success(`PDF '${data.displayName}' uppladdad!`); 
    onUploadSuccess?.(data);

    if (process.env.NODE_ENV !== "production") { 
    console.log("Upload result:", data); 
    }

} catch (err: any) { 
    console.error("Upload error:", err);
    toast.error(`Upload failed: ${err.message || "Unknown error"}`);
} finally { 
    setLoading(false);
    e.target.value = ""; 
}

}; 

return (
    <div>
        <input
        type="file"
        accept="application/pdf" // Only PDF(Text) for now
        className="hidden"
        id="pdfInput"
        onChange={handleUpload}
        />

        <button 
        type="button"
        className="rounded bg-blue-600 px-4 py-3 mb-4 hover:bg-blue-500"
        onClick={() => document.getElementById("pdfInput")?.click()}
        disabled={loading}
        >
            {loading ? "Loading..." : "Ladda upp PDF"}
        </button>
    </div>
);
}
