import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/secrets.server", () => ({ getSecrets: vi.fn().mockResolvedValue({}) }));
vi.mock("@/lib/browser-session.server", () => ({ createBrowserSession: vi.fn() }));
vi.mock("@/lib/brand-scan.server", () => ({
  BrandScanError: class extends Error {},
  brandSameSite: vi.fn(),
  readBrandPublic: vi.fn().mockResolvedValue({ body: "User-agent: *\nDisallow: /private" }),
}));
import { renderBrandPage } from "@/lib/brand-render.server";
import { createBrowserSession } from "@/lib/browser-session.server";
describe("read-only rendered discovery", () => {
  it("does not create a browser session without configured credentials", async () => {
    await expect(renderBrandPage("https://megsyai.com/", "https://megsyai.com")).rejects.toThrow();
    expect(createBrowserSession).not.toHaveBeenCalled();
  });
});