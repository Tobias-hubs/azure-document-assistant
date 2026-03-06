"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "./components/upload/UploadButton";
import { Message } from "./components/types/chat";
import { ChatFeed } from "./components/chat/ChatFeed";
import { ChatInput } from "./components/chat/ChatInput";
import { SourcePanel } from "./components/chat/SourcesPanel"; 
import { PdfChip } from "./components/pdf/PdfChip";


export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<any[]>([]); // Temporary any
  const [docId, setDocId] = useState<string | null>(null); 
  const [username, setUsername] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<ActiveDoc | null>(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [vectorStores, setVectorStores] = useState<{id: string, name: string}[]>([]);

  async function loadChat(username: string, docId: string) { 
    const res = await fetch( 
      `${API_URL}/api/chat/history?userName=${username}&docId=${docId}`
    );
    if (!res.ok) return; 
    const rows = await res.json();
    setMessages(rows); 
  }; 

  async function saveMessage(username: string, docId: string, sender: "user" | "ai", text: string) { 
    await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        docId,
        sender,
        text,
      }),
    });
  };



  type ActiveDoc = { 
    docId: string; 
    displayName: string; 
  };

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


  useEffect(() => {
    if (username && docId) {
      loadChat(username, docId);
    }
  }, [username, docId]);

  // SEARCH 1 Ask backend with question + docId or vectorStoreId
  const askBackend = async () => {
    if (!query) return; 

    if (!vectorStoreId && !docId) { 
      setMessages((prev) => [
        ...prev, 
        { sender: "ai", text: "Välj en kunskapsbas först" }, // Default  
      ]);
      return;
    }

    if (username && docId) {
      await saveMessage(username, docId, "user", query); // Save user message to backend
    }

    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setQuery("");
    setLoading(true);

    try {
      // Fallback: använd API_URL om den finns, annars localhost:3001
      const BASE_URL = API_URL || "http://localhost:3001";
      console.log("Sending search:", query, docId);

      const body: any = { query };
       if (docId) body.docId = docId;               
        else if (vectorStoreId) body.vectorStoreId = vectorStoreId;

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
      setMessages((prev) => [...prev, { sender: "ai", text: data.answer }]);
      if (username && docId) {
        await saveMessage(username, docId, "ai", data.answer);// Save AI answer to backend
       } 
      // saveMessage(username, docId, "ai", data.answer); // Save AI answer to backend
      setSources(data.sources);
    } catch (error) {
      console.error("Error fetching from backend:", error);

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
      <div className="w-full max-w-4xl flex flex-col h-full">
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-700 p-6 relative">
  <h1 className="text-2xl font-semibold flex gap-2">
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

          {/* Dropdown for vectorstore */}
  <div className="absolute right-6 top-12  flex items-center space-x-2">
    <label className="text-sm text-zinc-200 mr-2">Kunskapsbas:</label>
    <select
      value={vectorStoreId || ""}
      onChange={(e) => {
        const id = e.target.value;
        setVectorStoreId(id);
        setDocId(null); // Clear docId when vector store changes
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


        </div>

        {/* Chat feed */}
        <ChatFeed
      messages={messages}
      loading={loading}
      endRef={endRef}
        />

        
          <SourcePanel sources={sources} /> 
          {/* <PdfViewer pdfUrl={pdfUrl} />  */}
          {activeDoc && (
          <div className="space-y-4 p-6 border-t border-zinc-700">
          <PdfChip 
          displayName={activeDoc.displayName}
          onOpen={() => setIsPdfOpen(true)}
          onRemove={() => { 
            setActiveDoc(null);
            setDocId(null);
          }}
          />
        </div>
  )}

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
              setDocId(data.docId); 
              setActiveDoc({
                docId: data.docId, 
                displayName: data.displayName,
              });
              if (data.vectorStoreId) {
                setVectorStoreId(data.vectorStoreId);
                localStorage.setItem("vectorStoreId", data.vectorStoreId);
              } 
            }}
            />
          </div>
        </div>
      </div>
  );
}
