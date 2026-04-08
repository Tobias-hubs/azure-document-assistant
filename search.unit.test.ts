import { blob } from "stream/consumers"

jest.mock("@azure/search-documents", () => {
    return { 
        SearchClient: jest.fn().mockImplementation(() => ({
            search: jest.fn().mockReturnValue({
                results: {
                [Symbol.asyncIterator]: async function* () {
                    yield  {
                        document: {
                        content: "Test content from index", 
                        filename: "test.txt",
                        blobUrl: "https://example.com/test.txt"
                        },
                    };
                },
            },
        }),
        })),
        AzureKeyCredential: jest.fn(),
    }; 
});

import { POST } from "@/app/api/search/route";
import { NextRequest } from "next/server";

describe("POST /api/search", () => {
    it("returns result for matching text", async () => {
        const req = new NextRequest("http://localhost/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: "Azure"
                })
            }); 

            const res = await POST(req);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(Array.isArray(body.docs)).toBe(true);
            expect(body.docs).toHaveLength(1);
            expect(body.docs[0].content).toBe("Test content from index");
    });

});

        

