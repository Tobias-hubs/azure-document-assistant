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
              
                {/* Sources in AI answer */}
                {msg.sources && msg.sources.length > 0 && ( 
                    <div className="mt-4 border-t border-zinc-700 pt-3 space-y-2">
                        <p className="text-sm text-zinc-300 font-medium"> 
                            Källor:</p>
                        <ul className="list-disc list-inside text-sm text-zinc-300">
                            {msg.sources.map((source, index) => (
                                <li key={index}>
                                    {source.documentName} (s. {source.page})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
        </div>
        </div>
    );
}