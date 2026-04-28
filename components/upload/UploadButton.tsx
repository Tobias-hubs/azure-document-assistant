/*

import toast from "react-hot-toast";
import { useState } from "react";
 
type UploadButtonProps = { 
    onUploadSuccess?: (data: { blobUrl: string; filename: string }) => void;
};

export function UploadButton({ onUploadSuccess }: UploadButtonProps) { 
    const [loading, setLoading] = useState(false);

const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
   // <input type="file"> gives a File object. 
    const file = e.target.files?.[0]; 
    if (!file) return; 

    setLoading(true);

    try { 
    // Create a multipart/form-data payload
    // Form data allows to send binary files in an HTTP POST request.
    const formData = new FormData(); 
    formData.append("file", file);  
    
    // Backend uses Multer's upload.singe("file") to read as req.file
    const res = await fetch("/api/upload", {
        method: "POST", 
        body: formData, // Browser generates the correct multipart/form-data headers including boundaries, setting it manually would cause issues.
    });

    // Handle duplicate error (409 Conflict)
    if (!res.ok) {
        toast.error(`Upload failed with status ${res.status}.`);
        return; 
    }

    const data = await res.json();

    toast.success(`'${data.filename}' uppladdat!`);
    onUploadSuccess?.(data);

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
            {loading ? "Loading..." : ""}
        </button>
    </div>
  );
}

*/