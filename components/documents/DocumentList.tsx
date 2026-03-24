"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type DocumentItem = { 
    fileId: string; 
    vectorStoreFileId: string; 
    filename: string;
    uploadedAt: string | null;
};

type DocumentListProps = {
    refreshKey?: number; // Used to trigger re-render when documents change
};

export function DocumentList({ refreshKey }: DocumentListProps) { 
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(false);

    async function loadDocuments() {
        setLoading(true);
        try { 
            const res = await fetch(`${API_URL}/api/documents`); // REFACTOR endpoint for Azure
            if (!res.ok) { 
                throw new Error(`Failed to load documents: ${res.statusText}`);
            }
            const data = await res.json();
            setDocuments(data);
        } catch (err: any) {
            console.error("Error loading documents:", err);
            toast.error(`Error loading documents: ${err.message || "Unknown error"}`);
        } finally {
            setLoading(false);

        }
    }

    useEffect(() => {
        loadDocuments();
    }, [refreshKey]);

    async function handleDelete(fileId: string, vectorStoreFileId: string) {
        const res = await fetch(
            `${API_URL}/api/ingest/${fileId}/${vectorStoreFileId}`,
            { method: "DELETE" }
        );
        if (!res.ok) {
            throw new Error(`Failed to delete document: ${res.statusText}`);
            return; 
        }
        toast.success("Document deleted");
        loadDocuments(); // Refresh the list after deletion

       
    }

    async function handleReplace(filename: string) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "*/*";

        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const form = new FormData();
            form.append("file", file);
            form.append("filename", filename);

            // REFACTOR endpoint for Azure
            const res = await fetch (`${API_URL}/api/documents/replace`, {
                method: "POST",
                body: form,
            });
            
            if (!res.ok) {
                throw new Error(`Failed to replace document: ${res.statusText}`);
            }
            toast.success("Document replaced");
            loadDocuments(); // Refresh the list after replacement
        };
        input.click();
    }  

    return ( 
        <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Uppladdade dokument</h2>
            {loading && <p className="text-sm text-zinc-400">Laddar dokument...</p>}

            {documents.length === 0 && !loading && (
                <p className="text-sm text-zinc-400">Inga dokument uppladdade än.</p>
            )}
            <ul className="space-y-3">
                {documents.map((doc) => (
                    <li key={doc.vectorStoreFileId}
                     className="flex items-center justify-between bg-zinc-800 p-3 rounded"
                     >
                        <div>
                            <p className="font-medium">{doc.filename}</p>
                            <p className="text-sm text-zinc-400">
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "Datum ej tillgängligt"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                            onClick={() => handleDelete(doc.fileId, doc.vectorStoreFileId)}
                            className="text-sm text-red-400 hover:text-red-300"
                            >
                                Ta bort
                            </button>
                            <button 
                            onClick={() => handleReplace(doc.filename)}
                            className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                Ersätt
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    ); 
}