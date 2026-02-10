
type Source = { 
    documentName: string; 
    page: number; 
}; 

type Props = { 
    sources: Source[]; 
}; 

export function SourcePanel({ sources }: Props) { 
    if (!sources || sources.length === 0) return null; 

    return ( 
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4"> 
        <h3 className="font-semibold mb-2">Källor</h3>
        <ul className="list-disc pl-5 text-sm text-zinc-400 space-y-1">
            {sources.map((source, i) => ( 
                <li key={i}> 
                {source.documentName} - sida {source.page} 
                </li>
            ))}
        </ul>
        </div>
    );
}