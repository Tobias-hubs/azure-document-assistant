

type Props = { 
    displayName: string; 
    onOpen: () => void; 
    onRemove: () => void;
}; 

// function PdfChip 
export function PdfChip({ displayName, onOpen, onRemove}: Props) { 
    return (
        <div 
        onClick={onOpen}
        className="
        flex items-center gap-2 
        bg-zinc-800 border zinc-700
        px-3 py-2 rounded-lg
        cursor-pointer 
        hover:bg-zinc-700
        max-w-full"
        >
            <span className="text-sm truncate flex-1">
               📄 {displayName}
            </span>

            <button 
            onClick={(e) => { 
                e.stopPropagation();
                onRemove();
            }}
            className="text-zinc-400 hover:text-red-400"
            title="Ta bort dokument"
            >
                🗑
            </button>
        </div>
    )
}