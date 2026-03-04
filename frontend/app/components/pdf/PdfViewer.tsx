
type Props = { 
    pdfUrl: string | null; 
};

export function PdfViewer({ pdfUrl }: Props) { 
    if (!pdfUrl) { 
        return ( 
            <div className="bg-zinc-800 p-6 rounded-xl text-zinc-400 text-sm">
                Ingen PDF vald
            </div>

        ); 
    }

    return ( 
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden h-[500px]">
            <iframe 
            src={`${pdfUrl}#toolbar=0`}
            className="w-full h-full"
            title="PDF viewer"
            />
        </div>

    );
}



  
    // {/*PDF below chat */}

    //    {/* <div className="bg-zinc-800 rounded shadow overflow-hidden">
    //   {pdfUrl ? (        
    //     <iframe
    //       src={`${pdfUrl}#toolbar=0`} // Temporary solution
    //       className="w-full h-full"
    //     />
    //   ) : (
    //     <div className="p-6 text-zinc-400">Ingen PDF vald</div>
    //   )}
    // </div> */}