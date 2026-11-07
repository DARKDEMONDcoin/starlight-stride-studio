import { describe, expect, it } from "vitest";
import { readWelcomeAnalysis } from "@/lib/welcome-analysis";

function response(chunks: string[]) {
  return new Response(new ReadableStream({ start(controller) { for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk)); controller.close(); } }));
}
describe("real pre-signup analysis checkpoints", () => {
  it("reveals checkpoints in order and returns only the server result", async () => {
    const stages: number[] = [];
    const result = await readWelcomeAnalysis(response(['{"type":"progress","stage":0}\n{"type":"prog', 'ress","stage":1}\n{"type":"progress","stage":2}\n{"type":"progress","stage":3}\n{"type":"done","result":{"name":"Acme"}}\n']), (stage) => stages.push(stage));
    expect(stages).toEqual([0, 1, 2, 3]);
    expect(result.name).toBe("Acme");
  });
  it("never reports completion when the server fails", async () => {
    const stages: number[] = [];
    await expect(readWelcomeAnalysis(response(['{"type":"progress","stage":0}\n{"type":"error","message":"Blocked website"}\n']), (stage) => stages.push(stage))).rejects.toThrow("Blocked website");
    expect(stages).toEqual([0]);
  });
  it("does not invent completion on an interrupted stream", async () => {
    await expect(readWelcomeAnalysis(response(['{"type":"progress","stage":0}\n']), () => {})).rejects.toThrow();
  });
});