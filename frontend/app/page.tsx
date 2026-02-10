

"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "./components/upload/UploadButton";
import { Message } from "./components/types/chat";
import { ChatFeed } from "./components/chat/ChatFeed";
import { ChatInput } from "./components/chat/ChatInput";
import { SourcePanel } from "./components/chat/SourcesPanel"; 
import { PdfViewer } from "./components/pdf/PdfViewer";


export default function Home() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<any[]>([]); // Temporary any
  const [docId, setDocId] = useState<string | null>("sample"); // Hardcoded for dev
  const [username, setUsername] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (!loggedIn) {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "");
  }, []);

  const askBackend = async () => {
    if (!query || !docId) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Välj dokument och skriv en fråga." },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setQuery("");
    setLoading(true);

    try {
      // Fallback: använd API_URL om den finns, annars localhost:3001
      const BASE_URL = API_URL || "http://localhost:3001";

      const response = await fetch(`${BASE_URL}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          docId: docId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      // Ai answer
      setMessages((prev) => [...prev, { sender: "ai", text: data.answer }]);
      setSources(data.sources);
      setPdfUrl(`${BASE_URL}/documents/sample.pdf`); // TODO need to be changed
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
        <div className="shrink-0 border-b border-zinc-700 p-6">
          <h1 className="text-2xl font-semibold">
            Internal Document Assistant
          </h1>
          <p className="text-sm text-zinc-400">Inloggad som: {username}</p>
        </div>

        {/* Chat feed */}
        <ChatFeed
      messages={messages}
      loading={loading}
      endRef={endRef}
        />

        <div className="space-y-4 p-6 border-t border-zinc-700">
          <SourcePanel sources={sources} /> 
          <PdfViewer pdfUrl={pdfUrl} /> 
        </div>

        {/* Input & Upload */}
      <ChatInput
       query={query}
      setQuery={setQuery}
       loading={loading}
      onSubmit={askBackend}
  />
          <div className="mt-3 flex justify-end">
            <UploadButton />
          </div>
        </div>
      </div>
  );
}
