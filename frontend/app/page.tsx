"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "./components/upload/UploadButton";
import { Message } from "./components/types/chat";
import { ChatFeed } from "./components/chat/ChatFeed";
import { ChatInput } from "./components/chat/ChatInput";
import { PdfChip } from "./components/documents/PdfChip";
import { DocumentList } from "./components/documents/DocumentList";


export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [vectorStores, setVectorStores] = useState<{id: string, name: string}[]>([]);
  const [activeFile, setActiveFile] = useState<{ fileId: string; vectorStoreFileId: string, filename: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing re-render of DocumentList after upload/replace/delete
  const [showDocuments, setShowDocuments] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
  fetch(`${API_URL}/api/vector-stores`)
    .then(r => r.json())
    .then(setVectorStores)
    .catch(console.error);
}, []);

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("vectorStoreId");
    if (saved) setVectorStoreId(saved);
  } , []);


  // SEARCH 1 Ask backend with question + vectorStoreId
  const askBackend = async () => {
    if (!query) return; 

    if (!vectorStoreId ) { 
      setMessages((prev) => [
        ...prev, 
        { sender: "ai", text: "Välj en kunskapsbas först" }, // Default  
      ]);
      return;
    }

  
    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setQuery("");
    setLoading(true);

    try {
      // Fallback: använd API_URL om den finns, annars localhost:3001
      const BASE_URL = API_URL || "http://localhost:3001";
      console.log("Sending search:", query);

      const body: any = { query, vectorStoreId};
       
      const response = await fetch(`${BASE_URL}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      // Ai answer
      setMessages((prev) => [...prev, { sender: "ai", text: data.answer, sources: data.sources || [] 
       }]);


      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Something went wrong with backend response." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-zinc-900 text-zinc-100 flex justify-center">

    
      <div className="w-full max-w-6xl flex flex-col h-full">
       
       
      
        <header className="shrink-0 border-b border-zinc-700 p-6 flex items-start sm:items-center gap-20">
 {/* Hamburger button */}
  <button 
  onClick={() => setShowDocuments(true)}
  className="p-2 text-zinc-300 hover:text-white"
  > 
  ☰
  </button>
<div className="flex flex-col">
  <h1 className="text-2xl font-semibold flex gap-2 flex-wrap">
    <span className="text">Internal</span>
    <span className="text">Document</span>
    <span className="text">Assistant</span>
  </h1>
  
  {/* style logo */}
  <div className="flex gap-3 mt-0 -ml-4">
    <div className="w-3 h-3 rounded-full bg-white"></div>
    <div className="w-3 h-3 rounded-full bg-[#d50e1b]"></div>
    <div className="w-3 h-3 rounded-full bg-[#f7b910]"></div>
    <div className="w-3 h-3 rounded-full bg-[#68ae3f]"></div>
    <div className="w-3 h-3 rounded-full bg-white"></div>
    <div className="w-3 h-3 rounded-full bg-white"></div>
    <div className="w-3 h-3 rounded-full bg-white"></div>
  </div>

  <p className="text-sm text-zinc-400 mt-3">
    Inloggad som: {username}
  </p>
</div>
          {/* Dropdown for vectorstore */}
  <div className=" right-6 top-12  flex items-center space-x-2">
    <label className="text-sm text-zinc-200 mr-2">Kunskapsbas:</label>
    <select
      value={vectorStoreId || ""}
      onChange={(e) => {
        const id = e.target.value;
        setVectorStoreId(id);
        localStorage.setItem("vectorStoreId", id);
      }}
      className="bg-zinc-800 text-zinc-100 p-1 rounded"
    >
      <option value="" disabled>-- Ingen --</option>
      {vectorStores.map(store => (
        <option key={store.id} value={store.id}>{store.name}</option>
      ))}
    </select>
  </div>
        </header>

        {/* Chat feed */}
        <div className="flex-1 overflow-auto">
        <ChatFeed
      messages={messages}
      loading={loading}
      endRef={endRef}
        />
</div>

        {/* Input & Upload */}
      <ChatInput
       query={query}
      setQuery={setQuery}
       loading={loading}
      onSubmit={askBackend}
  />
          <div className="mt-3 flex justify-end">
            <UploadButton
            onUploadSuccess={async (data) => { 
              if (data.vectorStoreId) {
                setVectorStoreId(data.vectorStoreId);
                localStorage.setItem("vectorStoreId", data.vectorStoreId);
              } 
              setActiveFile({ fileId: data.fileId, vectorStoreFileId: data.vectorStoreFileId, filename: data.filename });

            setRefreshKey(k => k + 1); 
          }}
            />
          </div>
          
{showDocuments && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex">
    <div className="w-80 bg-zinc-900 shadow-xl p-4 h-full overflow-auto">
      
      {/* Stäng-knapp */}
      <button
        className="mb-4 text-zinc-400 hover:text-white"
        onClick={() => setShowDocuments(false)}
      >
        Stäng ✕
      </button>

          <DocumentList refreshKey={refreshKey} />
        </div>
      </div>
)}
      </div>
    </div>
  );
}
