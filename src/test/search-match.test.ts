import { describe, expect, it } from "vitest";
import { searchMatches } from "@/lib/search-match";
describe("website list searches", () => {
  it("matches English app names and Google aliases regardless of case", () => {
    expect(searchMatches(" FACEBOOK ", "facebook", "فيسبوك")).toBe(true);
    expect(searchMatches("google", "analytics", "جوجل أناليتكس")).toBe(true);
    expect(searchMatches("GA4", "analytics")).toBe(true);
  });
  it("matches Arabic with optional diacritics", () => {
    expect(searchMatches("سراج", "سِراج")).toBe(true);
  });
  it("clearing restores results and unmatched searches exclude them", () => {
    expect(searchMatches(" ", "facebook")).toBe(true);
    expect(searchMatches("zzzz-no-match-zzzz", "facebook")).toBe(false);
  });
});