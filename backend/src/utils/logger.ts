export class MockLogger {
  logSearch(docId: string, query: string, sources: any[], latencyMs: number): void {
    console.log(`[MOCK LOG] Doc: ${docId} | Query: "${query}" | Sources: ${sources.length} | Latency: ${latencyMs}ms`);
  }
}
