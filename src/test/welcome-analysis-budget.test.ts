import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/welcome-understand.server", () => ({ analyzeWebsite: vi.fn().mockResolvedValue({ name: "Acme" }), cachedAnalysis: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/rate-limit.server", () => ({ isRateLimited: vi.fn().mockResolvedValue(false), requestIdentifier: () => "welcome-budget-test" }));
import { runWelcomeAnalysis } from "@/lib/welcome-analysis.server";
import { analyzeWebsite } from "@/lib/welcome-understand.server";
describe("anonymous analysis budget", () => {
  it("allows eight attempts then rejects the ninth before analysis", async () => {
    const request = new Request("https://getziad.com/api/public/welcome-analysis");
    for (let index = 0; index < 8; index++) await runWelcomeAnalysis("example.com", request);
    await expect(runWelcomeAnalysis("example.com", request)).rejects.toThrow();
    expect(analyzeWebsite).toHaveBeenCalledTimes(8);
  });
});