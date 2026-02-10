import { Message } from "../types/chat";

export function ChatMessage({ msg }: { msg: Message }) { 
    const isUser = msg.sender === "user"; 


    return ( 
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div 
            className={`
                max-w-[70%]
                px-4 py-3 
                rounded-2xl 
                leading-relaxed 
                whitespace-pre-wrap 
                break-words
                ${ 
                    isUser
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                }
                `}
                >
                    {msg.text}
                </div>
        </div>
    );
}