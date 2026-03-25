// import { HostedRagService } from "../services/rag/HostedRagService"; 
/* 
type MockOpenAI = { 
    responses: { create: jest.Mock }; 
    vectorStores: { files: { list: jest.Mock} };
}; 

describe("HostedRagService answer - text answer only", () => {
    let mockClient: MockOpenAI; 
    let ragService: HostedRagService; 

    beforeEach(() => { 
        mockClient = { 
            responses: { 
                create: jest.fn().mockResolvedValue({
                    output: [ 
                        { 
                            type: "message", 
                            content: [ 
                                { type: "output_text", text: "First row of answer." },
                                { type: "output_text", text: "Second row of answer." }

                            ]
                        }
                    ]
            })
        }, 
        vectorStores: { 
            files: { 
                list: jest.fn().mockResolvedValue({ data: [] })
            }
        }
    } as unknown as MockOpenAI;

    ragService = new HostedRagService(mockClient as any, "vs_test");
    });

    it("should return text answer from response.output", async () => { 
        const result = await ragService.answer("What is the answer to the question?", "vs_test");

        // Check that model is called 
        expect(mockClient.responses.create).toHaveBeenCalledTimes(1);

        expect(result.text).toBe("First row of answer.\nSecond row of answer.");
        expect(result.sources).toEqual([]); // Ignore sources for this test 
    });

    it("should return empty string if no output_text blocks", async () => { 
        mockClient.responses.create.mockResolvedValueOnce({ 
            output: [{ type: "message", content: [] }] 
        }); 

        const result = await ragService.answer("Ask without text", "vs_test");
        expect(result.text).toBe("");
        expect(result.sources).toEqual([]);
    }); 

    it("handle answer with no output array", async () => { 
        mockClient.responses.create.mockResolvedValueOnce({}); 
        const result = await ragService.answer("Ask with no output", "vs_test");
        expect(result.text).toBe("");
        expect(result.sources).toEqual([]);
    }); 
}); 

*/