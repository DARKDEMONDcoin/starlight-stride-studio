import { describe, expect, test } from "bun:test";
import { brandCompleteness, contrastRatio, cssHex, mergeDetected, normalizeBrandUrl, robotsAllows } from "../../src/lib/brand-brain";
import { employeeId, employeeSlug } from "../../src/lib/employee-slugs";
import { brandBodyCollector, BrandScanError } from "../../src/lib/brand-scan.server";
describe("Bounded business website reading", () => {
  test("accepts a 709310-byte homepage above the former limit", () => {
    const body = brandBodyCollector("html");
    body.push(Buffer.alloc(400000, "a")); body.push(Buffer.alloc(309310, "b"));
    expect(Buffer.byteLength(body.text())).toBe(709310);
  });
  test("HTML accepts exactly 1 MiB and rejects the next streamed byte", () => {
    const body = brandBodyCollector("html"); body.push(Buffer.alloc(1048576));
    expect(Buffer.byteLength(body.text())).toBe(1048576);
    expect(() => body.push(Buffer.from("x"))).toThrow(BrandScanError);
  });
  for (const kind of ["css", "text"] as const) test(`${kind} retains its 512000-byte boundary`, () => {
    const body = brandBodyCollector(kind); body.push(Buffer.alloc(512000));
    expect(Buffer.byteLength(body.text())).toBe(512000);
    expect(() => body.push(Buffer.from("x"))).toThrow(BrandScanError);
  });
});
describe("Brand Brain rules", () => {
  test("four populated sections yield 100 percent and three yield 75", () => {
    expect(brandCompleteness({ business: { data: { summary: "Business" } }, audience: { data: { segments: ["Customers"] } }, voice: { data: { attributes: ["Warm"] } } })).toBe(75);
    expect(brandCompleteness({ business: { data: { summary: "Business" } }, audience: { data: { segments: ["Customers"] } }, voice: { data: { attributes: ["Warm"] } }, identity: { data: { fonts: ["Font"] } } })).toBe(100);
  });
  test("rescan suggests rather than overwrites user edits", () => {
    const merged = mergeDetected({ data: { summary: "Owner fact", industry: "" }, edited_fields: ["summary"] }, { summary: "AI guess", industry: "Retail" });
    expect(merged.data.summary).toBe("Owner fact"); expect(merged.suggestions?.summary).toBe("AI guess"); expect(merged.data.industry).toBe("Retail");
  });
  test("URL normalization adds HTTPS and rejects private literal destinations", () => {
    expect(normalizeBrandUrl("getziad.com")).toBe("https://getziad.com/"); expect(normalizeBrandUrl("127.0.0.1")).toBeNull(); expect(normalizeBrandUrl("https://test.internal/")).toBeNull();
  });
  test("robots disallow is honored and more specific allow wins", () => {
    const robots="User-agent: *\nDisallow: /private\nAllow: /private/public";
    expect(robotsAllows(robots,"/private/a")).toBe(false); expect(robotsAllows(robots,"/private/public/a")).toBe(true);
  });
  test("WCAG contrast computes concrete black/white and identical values", () => { expect(contrastRatio("#000000", "#ffffff")).toBe(21); expect(contrastRatio("#ffffff", "#ffffff")).toBe(1); });
  test("CSS colors normalize without invented opaque replacements", () => { expect(cssHex("rgb(255, 0, 0)")).toBe("#ff0000"); expect(cssHex("rgba(0,0,0,0.2)")).toBeNull(); });
  test("ignored unchanged suggestions do not reappear on rescan", () => {
    const merged = mergeDetected({ data: { summary: "Owner fact" }, edited_fields: ["summary"], ignored: { summary: "Old guess" } }, { summary: "Old guess" });
    expect(merged.data.summary).toBe("Owner fact"); expect(merged.suggestions?.summary).toBeUndefined();
    expect(mergeDetected(merged, { summary: "New evidence" }).suggestions?.summary).toBe("New evidence");
  });
  test("all six human-name URLs round-trip to permanent employee IDs", () => {
    for (const [id, slug] of [["sonny", "siraj"], ["eva", "amal"], ["sam", "salem"], ["nour", "nour"], ["dana", "dana"], ["adam", "adam"]]) {
      if (!id || !slug) throw new Error("Missing test pair");
      expect(employeeSlug(id)).toBe(slug); expect(employeeId(slug)).toBe(id);
    }
  });
});