/* In the future this component may need to be refactored, 
if documents reside in a database this may need to be implemented instead of upload from files*/
import toast from "react-hot-toast";

type UploadResult = { 
    docId: string; 
    displayName: string; 
}; 

type UploadButtonProps = { 
    onUploadSuccess?: (data: UploadResult) => void;
};

export function UploadButton({ onUploadSuccess }: UploadButtonProps) { 
const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
   //INGEST  1 - User selects a PDF file in browser.
   // <input type="file"> gives a File object. 
    const file = e.target.files?.[0];
    if (!file) return; 

    // Create a multipart/form-data payload
    // Form data allows to send binary files in an HTTP POST request.
    const formData = new FormData(); 

    // Append the actual PDF file (binary )
    formData.append("file", file); 
    
    //  Send to PDF to backend /api/ingest
    // Backend uses Multer's upload.singe("file") to read as req.file
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingest`, {
        method: "POST", 
        // Do not set Content-Type manually for FormData. 
        body: formData, 
    });
   
    // Parse backend response & runtime check
    const raw = await res.json(); 
    if (!raw.docId || !raw.displayName) { 
        throw new Error("Invalid response from server"); 
    } 
    
    const data: UploadResult = raw;
    
    //  const data: UploadResult = await res.json(); 
   

    // Notify user
    toast.success(`PDF '${data.displayName}' uppladdad!`); 
    onUploadSuccess?.(data);

    if (process.env.NODE_ENV !== "production") { 
    console.log("Upload result:", data); 
    }

    e.target.value = ""; 

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
        >
            Upload PDF
        </button>
    </div>
);
}