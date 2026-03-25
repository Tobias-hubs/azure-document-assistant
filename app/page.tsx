"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/components/upload/UploadButton";
import { Message } from "@/components/types/chat";
import { ChatFeed } from "@/components/chat/ChatFeed";
import { ChatInput } from "@/components/chat/ChatInput";
// import { PdfChip } from "./components/documents/PdfChip";
import { DocumentList } from "@/components/documents/DocumentList";


export default function Home() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  
  // Scroll to bottom of chat
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Azure : Implement Azure auth? 
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
  }, []);

  async function handleChat() { 
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: query }
    ]);
    //setQuery("");
    setLoading(true);

    try { 
      // Vector search by Azure Search
      const searchResponse = await fetch("/api/search", { 
        method: "POST", 
        // Headers? 
        body: JSON.stringify({ query }),
      });

      const searchData = await searchResponse.json();
      const docs = searchData.docs || [];

      // Chat completion by Azure OpenAI
      const chatResponse = await fetch("/api/chat", { 
        method: "POST", 
        body: JSON.stringify({ 
          query, 
          context: docs,
        }),
      });

      const chatData = await chatResponse.json();

      // Add Ai response to chat history
      setMessages((prev) => [
        ...prev, 
        { sender: "ai", text: chatData.answer, context: docs },
       ]);
    } catch (error) { 
      console.error("Error during chat:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Something went wrong. Please try again." },
      ]);
    }

    setQuery("");
    setLoading(false);
  }

  return (
    <div className="h-screen bg-zinc-900 text-zinc-100 flex justify-center">
      <div className="w-full max-w-6xl flex flex-col h-full">
        <header className="shrink-0 border-b border-zinc-700 p-6 flex items-start sm:items-center sm:justify-between gap-4">
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
        </header>

        {/* Chat feed */}
        <div className="flex-1 overflow-auto">
          <ChatFeed messages={messages} loading={loading} endRef={endRef} />
        </div>

        {/* Input */}
        <ChatInput
          query={query}
          setQuery={setQuery}
          loading={loading}
          onSubmit={handleChat}
        />

        {/* Upload Button */}
        <div className="mt-3 flex justify-end">
          <UploadButton
          // onUploadSuccess={async (data) => {
          //   if (data.vectorStoreId) {
          //     setVectorStoreId(data.vectorStoreId);
          //     localStorage.setItem("vectorStoreId", data.vectorStoreId);
          //     }
          //     setActiveFile({ fileId: data.fileId, vectorStoreFileId: data.vectorStoreFileId, filename: data.filename });

          //   setRefreshKey(k => k + 1);
          // }}
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

              <DocumentList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
