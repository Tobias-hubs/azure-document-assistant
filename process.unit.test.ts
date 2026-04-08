jest.mock("@azure/search-documents", () => {
    return { 
        SearchClient: jest.fn().mockImplementation(() => ({
            uploadDocuments: jest.fn().mockResolvedValue({}),
        })),
        AzureKeyCredential: jest.fn()
    }; 
});

import { POST } from "@/app/api/process/route";
import { NextRequest } from "next/server";

describe("POST /api/process", () => {
    it("indexes text and returns success", async () => {
        const req = new NextRequest("http://localhost/api/process", {
            method: "POST",
            body: JSON.stringify({
                text: "This is a test document.", 
                filename: "test.txt",
                blobUrl: "https://example.com/test.txt",
            }),
        });
            
            const res = await POST(req); 
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
        });

    });
