import { NextResponse } from "next/server"; 

const SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT!;
const SEARCH_KEY = process.env.AZURE_SEARCH_API_KEY!;
const INDEX_NAME = process.env.AZURE_SEARCH_INDEX_NAME!;

async function runIndexer() {
    const res = await fetch(`${SEARCH_ENDPOINT}/indexers/${INDEX_NAME}/run?api-version=2023-11-01`, 
        { 
            method: "POST",
            headers: { 
                "api-key": SEARCH_KEY,
            },
        }
    );

    if (!res.ok) {
        throw new Error(await res.text());
    }   
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function runEmbeddings() {
    await import("../../../scripts/generateEmbeddings");
}

export async function POST() {

    try { 
        console.log("Running indexer...");
        
        await runIndexer();
        
        await wait(5000);

        await runEmbeddings();
        console.log("Embeddings Done!");

        return NextResponse.json({ status: "success" });
    } catch (error) {
        return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 500 }
    );
    }
}