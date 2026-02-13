export class Logger {
  logSearch(docId: string, query: string, sources: any[], latencyMs: number): void {
    console.log(`[SEARCH] Doc: ${docId} | Query: "${query}" | Sources: ${sources.length} | Latency: ${latencyMs}ms`);
  }
}
