import { describe, expect, it } from "vitest";
import { emptyWorkplace, minimizeSetupNavigation } from "@/lib/workplace-setup";

describe("minimized navigation during workplace setup", () => {
  for (const stage of ["objectives", "employees", "tools", "ready"] as const) {
    it(`minimizes both rails during ${stage}, including brand and integration visits`, () => {
      const profile = { workplaceSetup: { ...emptyWorkplace(), stage } };
      for (const path of ["/app/setup", "/app/brand", "/app/integrations"]) {
        expect(minimizeSetupNavigation(path, profile, "2026-11-01T00:00:00Z")).toBe(true);
      }
    });
  }
  it("restores normal navigation after completion, but minimizes setup revisits", () => {
    const profile = { workplaceSetup: { ...emptyWorkplace(), stage: "complete" } };
    expect(minimizeSetupNavigation("/app", profile, "2026-11-01T00:00:00Z")).toBe(false);
    expect(minimizeSetupNavigation("/app/setup", profile, "2026-11-01T00:00:00Z")).toBe(true);
  });
  it("does not minimize legacy workspaces outside setup", () => {
    expect(minimizeSetupNavigation("/app", {}, "2026-10-01T00:00:00Z")).toBe(false);
  });
});