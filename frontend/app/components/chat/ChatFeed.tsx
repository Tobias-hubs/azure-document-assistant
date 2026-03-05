import { Message } from "../types/chat"; 
import { ChatMessage } from "./ChatMessage"; 
import { TypingIndicator } from "./TypingIndicator";
import { RefObject } from "react"; 

type Props = { 
    messages: Message[]; 
    loading: boolean; 
    endRef: RefObject<HTMLDivElement | null>; 
}; 
// SEARCH 7 + SourcesPanel
export function ChatFeed({ messages, loading, endRef }: Props) { 
    return ( 
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.map((msg, i) => ( 
            <ChatMessage key={i} msg={msg} /> 
        ))}
        {loading && <TypingIndicator />}
        <div ref={endRef} />
        </div>
    );
}