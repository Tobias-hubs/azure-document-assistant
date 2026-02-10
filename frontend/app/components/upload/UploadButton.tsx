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
    const file = e.target.files?.[0];
    if (!file) return; 

    const formData = new FormData(); 
    formData.append("file", file); 
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingest`, {
        method: "POST", 
        body: formData, 
    });
   
    const data: UploadResult = await res.json(); 

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
        accept="application/pdf"
        className="hidden"
        id="pdfInput"
        onChange={handleUpload}
        />
        <button 
        type="button"
        className="rounded bg-blue-600 px-4 py-3 hover:bg-blue-500"
        onClick={() => document.getElementById("pdfInput")?.click()}
        >
            Upload PDF
        </button>
    </div>
);
}