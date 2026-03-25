

type Props = { 
    query: string; 
    setQuery: (value: string) => void; 
    loading: boolean; 
    onSubmit: () => void; 
}; 

export function ChatInput({ query, setQuery, loading, onSubmit }: Props) { 
    return ( 
        <form 
        onSubmit={(e) => { 
            e.preventDefault(); 
            if (!loading) onSubmit(); 
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
                  if (!loading && query.trim()) onSubmit();
                }
              }}
            />
        <button
        type="submit"
        disabled={loading || !query.trim()}
        className="shrink-0 rounded bg-blue-600 px-4 py-2 hover:bg-blue-500 disabled:opacity-50 text-sm"
      >
        Skicka
      </button>
        </form>
    );
}
