"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/components/upload/UploadButton";
import { Message } from "@/components/types/chat";
import { ChatFeed } from "@/components/chat/ChatFeed";
import { ChatInput } from "@/components/chat/ChatInput";
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

    setMessages((prev) => [...prev,
      { sender: "user", text: query }
    ]);
    //setQuery("");
    setLoading(true);

    try { 
      // Vector search by Azure Search
      const searchResponse = await fetch("/api/search", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const searchData = await searchResponse.json();

      const docs = searchData.docs ?? [];
      
      console.log(" Docs from search:", docs.map((d: any) => d.filename) );


      // VISION 
      // const isImageQuestion = 
      // /bild|bilder|diagram|figur|illustration/i.test(query);

      // VISION works with explicit jpg file from blob storage
     // const imageDoc = { filename: "animal-8748794_1280.jpg" }; // VISION Needs raw image format not PDF - Hardcoded (choice not data) for vision testing, 
     // NOTE GhostScript or Poppler as stateless rasterizer  for pdf to image 
     const isImageQuestion = 
/bild|image|diagram|figur|grafik|picture|photo/i.test(
    query.toLowerCase()
  );

     if (isImageQuestion) {
        
        const visionResponse = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            question: query, 
            }),
          });
          const visionData = await visionResponse.json();

          setMessages((prev) => [
            ...prev, 
            { sender: "ai", text: visionData.answer,
              vision: [ { 
                blobUrl: visionData.imageUrl } ],
              },
          ]);

          return;
      }

      // Chat (Text) completion by Azure OpenAI
      const chatResponse = await fetch("/api/chat", { 
       
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: query, 
          docs,
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
    } finally { 

    setQuery("");
    setLoading(false); 
  }
  }

  return (
    <div className="h-screen bg-zinc-900 text-zinc-100 flex">
      <div className="flex-1 flex flex-col">
        <header className="shrink-0 h-14 px-4 text-sm"> 
          <div className="grid grid-cols-3 items-center h-full max-w-7xl mx-auto">
          {/* Hamburger button */}
          <button
            onClick={() => setShowDocuments(true)}
            className="text-zinc-300 hover:text-white justify-self-start -ml-4 sm:-ml-0"
          >
            ☰
          </button>

          <div className="flex flex-col items-center justify-center min-w-0">
            <h1 className="text-sm sm:text-base font-medium text-zinc-200 truncate max-w-full">
              Internal Document Assistant
            </h1>

            {/* style logo 
            <div className="flex gap-3 mt-0 -ml-4">
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <div className="w-3 h-3 rounded-full bg-[#d50e1b]"></div>
              <div className="w-3 h-3 rounded-full bg-[#f7b910]"></div>
              <div className="w-3 h-3 rounded-full bg-[#68ae3f]"></div>
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <div className="w-3 h-3 rounded-full bg-white"></div>
            </div>*/}

            <p className="text-xs text-zinc-400 truncate">
              Inloggad som: {username}
            </p>
          </div>
          <div />
          </div>
        </header>

        {/* Chat feed */}
        <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-12 py-10 lg:py-20">
          <ChatFeed messages={messages} loading={loading} endRef={endRef} />
        </div>
        </div>

        {/* Input */}
        <div className="mx-auto w-full max-w-5xl px-4"> 
        <ChatInput
          query={query}
          setQuery={setQuery}
          loading={loading}
          onSubmit={handleChat}
        />
        </div>

        {/* Upload Button */}
        <div className="mt-3">
        <div className="mx-auto max-w-1xl px-3 flex justify-end">
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
        </div>


              {/* Not to be shown? Only for admin  */}
        {showDocuments && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex">
            <div className="w-80 bg-zinc-900 shadow-xl p-4 h-full overflow-auto">

              {/*  */}
              {/* Stäng-knapp */}
              <button
                className="mb-4 text-zinc-400 hover:text-white"
                onClick={() => setShowDocuments(false)}
              >
                Stäng ✕
              </button>
              
{/* Add darkmode and or (settings) */}
              <DocumentList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
