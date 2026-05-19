jest.mock("openai", () => {
    return { 
        AzureOpenAI: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [ 
                            {
                                message: { 
                                    content: "Test answer", 
                                },
                            },
                        ],
                    }),
                },
            },
    })),
};
}); 

import { POST } from "@/app/api/chat/route";
import { NextRequest } from "next/server";

describe("POST /api/chat", () => {
    it("returns answer from AI", async () => {
        const req = new NextRequest("http://localhost/api/chat", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                question: "What is written in the document?",
                docs: [{ content: "Test content" }], 
            }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.answer).toBe("Test answer");
        expect(body.needsVision).toBe(false);
    });

    it("returns 400 if missing input", async () => {
        const req = new NextRequest("http://localhost/api/chat", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                // question is missing
                docs: [{ content: "Test content" }], 
            }),
        });

        const res = await POST(req);

        expect(res.status).toBe(400);
    });
});