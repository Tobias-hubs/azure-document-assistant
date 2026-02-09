// TODO Refactor into smaller components?

"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "./UploadButton"

type Message = {
  sender: "user" | "ai";
  text: string;
};

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
    <div className="min-h-screen flex flex-col bg-zinc-900 text-zinc-100">
      <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-6">
          <h1 className="text-2xl font-semibold">
            Internal Document Assistant
          </h1>

          <p className="text-sm text-zinc-400">Inloggad som: {username}</p>

          {/* Chat feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* User message */}
            {/* {query && (
              <div className="text-right">
                <div className="bg-blue-600 text-white p-3 rounded-xl inline-block max-w-xl">
                  {query}
                </div>
              </div>
            )} */}

            {/* AI message */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.sender === "user" ? "text-right" : ""}
              >
                <div
                  className={
                    msg.sender === "user"
                      ? "bg-blue-600 text-white p-3 rounded-xl inline-block max-w-xl"
                      : "bg-zinc-800 text-zinc-100 p-4 rounded-xl inline-block max-w-xl"
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}

            <div ref={endRef} />
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="bg-zinc-800 p-4 rounded-xl">
              <h3 className="font-semibold">Källor:</h3>
              <ul className="list-disc pl-5 text-sm text-zinc-400">
                {sources.map((source, index) => (
                  <li key={index}>
                    {source.documentName} - sida {source.page}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="min-h-screen flex items-center justify-center bg-zinc-900">
          <div className="w-full max-w-xl px-4 flex flex-col gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) askBackend();
              }}
              className="border-t border-zinc-700 p-4 flex gap-2"
            >
              <input
                className="flex-1 rounded bg-zinc-800 border border-zinc-700 p-3"
                type="text"
                placeholder="Skriv din fråga här"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-500" //"rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:opacity-50"
                disabled={loading || !query.trim()}
              >
                {loading ? "AI skriver..." : "Skicka"}
              </button>
            </form>
          </div>

          {/*PDF below chat */}

          {/* <div className="bg-zinc-800 rounded shadow overflow-hidden">
        {pdfUrl ? (         // TODO PDF ingestion / PDF view 
          <iframe
            src={`${pdfUrl}#toolbar=0`} // Temporary solution
            className="w-full h-full"
          />
        ) : (
          <div className="p-6 text-zinc-400">Ingen PDF vald</div>
        )}
      </div> */}

      <UploadButton/>
        </div>
      </div>
    </div>
  );
}
