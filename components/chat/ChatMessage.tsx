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

                    {/* Vision image + caption  */}
                    {msg.vision && (
                        
            <div className="mt-4 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                <div className="text-sm text-zinc-400 mb-2">
                 Bild hittad på sida {msg.vision.page}
             </div>

         <img
             src={`data:image/png;base64,${msg.vision.imageBase64}`}
        alt="Bild från PDF"
        className="rounded-lg max-w-full border border-zinc-600"
         />

             <div className="mt-2 text-sm text-zinc-300">
            {msg.vision.caption}
            </div>
        </div>
        )}

              
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