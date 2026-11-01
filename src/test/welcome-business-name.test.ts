import { beforeEach, describe, expect, it } from "vitest";
import { readWelcomeDraft, signupCompany, writeWelcomeDraft } from "@/lib/welcome-draft";
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
describe("discovered business identity", () => {
  it("retains the discovered business name across reloads", () => {
    writeWelcomeDraft({ website: "https://example.com", businessName: "Example Business" });
    expect(readWelcomeDraft()?.businessName).toBe("Example Business");
    expect(signupCompany(readWelcomeDraft(), "Personal Name")).toBe("Example Business");
  });
  it("supports older drafts without a discovered name", () => {
    expect(signupCompany({ website: "https://example.com" }, "Personal Name")).toBe("Personal Name");
    expect(signupCompany({ businessName: "Old business" }, "Personal Name")).toBe("Personal Name");
  });
});