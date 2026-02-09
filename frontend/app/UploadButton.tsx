

export function UploadButton() { 
const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (!file) return; 

    const formData = new FormData(); 
    formData.append("pdf", file);

    const res = await fetch("/api/upload-pdf", {
        method: "POST", 
        body: formData, 
    });

    const data = await res.json(); 
    console.log("Upload result:", data); 
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
        className="rounded bg-blue-600 px-4 py-3 hover:bg-blue-500"
        onClick={() => document.getElementById("pdfInput")?.click()}
        >
            Upload PDF
        </button>
    </div>
)
}