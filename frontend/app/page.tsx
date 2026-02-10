// TODO Refactor into smaller components?

// TODO UI is buggy! needs to be adressed

"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "./UploadButton";

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
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "flex justify-end" : "flex justify-start"}`}
            >
              <div
                className={`
                    max-w-[70%]
                    rounded-2xl 
                    px-4 py-3
                    leading-relaxed
                    whitespace-pre-wrap
                    break-words
                    ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white p-3 rounded-xl inline-block max-w-xl"
                        : "bg-zinc-800 text-zinc-100 p-4 rounded-xl inline-block max-w-xl"
                    }
                    `}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-zinc-400 px-4 py-3 rounded-2xl rounded-bl-sm text-sm italic">
                AI skriver...
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input & Upload */}
        <div className="shrink-0 border-t border-zinc-700 p-4 bg-zinc-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading) askBackend();
            }}
            className="flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-3 py-2"
          >
            <textarea
              rows={1}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              placeholder="Skriv din fråga här"
              className="flex-1
            resize-none
            bg-transparent
            text-zinc-100
            placeholder-zinc-400
            outline-none
            leading-6
            max-h-40
            overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading && query.trim()) askBackend();
                }
              }}
            />

            <button
              type="submit"
              className="shrink-0 rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:opacity-50 text-sm" //"rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:opacity-50"
              disabled={loading || !query.trim()}
            >
              Skicka
            </button>
          </form>
          <div className="mt-3 flex justify-end">
            <UploadButton />
          </div>
        </div>
      </div>
    </div>

    // {/* Sources */}
    // {sources.length > 0 && (
    //   <div className="bg-zinc-800 p-4 rounded-xl">
    //     <h3 className="font-semibold">Källor:</h3>
    //     <ul className="list-disc pl-5 text-sm text-zinc-400">
    //       {sources.map((source, index) => (
    //         <li key={index}>
    //           {source.documentName} - sida {source.page}
    //         </li>
    //       ))}
    //     </ul>
    //   </div>
    // )}

    // {/*PDF below chat */}

    //    {/* <div className="bg-zinc-800 rounded shadow overflow-hidden">
    //   {pdfUrl ? (         // TODO PDF ingestion / PDF view
    //     <iframe
    //       src={`${pdfUrl}#toolbar=0`} // Temporary solution
    //       className="w-full h-full"
    //     />
    //   ) : (
    //     <div className="p-6 text-zinc-400">Ingen PDF vald</div>
    //   )}
    // </div> */}
  );
}
