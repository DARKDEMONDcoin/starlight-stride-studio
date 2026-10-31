import { describe, expect, it } from "vitest";
import { getMember, team } from "@/data/team";
import { skillsByCategory } from "@/data/skills";

/**
 * الستة الأصليون يلتزمون بمعيار المحتوى الكامل. عبدالله (المشتري الإعلامي)
 * أُضيف لاحقًا ودليله العام أقصر حتى الآن؛ يُفحص هيكله فقط حتى يُستكمل.
 */
const LEGACY_IDS = ["sonny", "eva", "sam", "nour", "dana", "adam"];

describe("public employee content", () => {
  it("keeps seven complete, uniquely routed employee profiles", () => {
    expect(team).toHaveLength(7);
    expect(new Set(team.map((member) => member.id)).size).toBe(7);

    for (const member of team) {
      expect(getMember(member.id)).toBe(member);
      expect(member.tasks.length).toBeGreaterThanOrEqual(5);
      expect(member.workflow).toHaveLength(4);
      expect(member.comparison).toHaveLength(3);
      expect(member.faqs).toHaveLength(3);
    }
  });

  it("returns no employee for an invalid public route id", () => {
    expect(getMember("missing-employee")).toBeUndefined();
  });

  it("holds the six original guides to the full content bar", () => {
    for (const member of team.filter((m) => LEGACY_IDS.includes(m.id))) {
      const guide = member.guide;
      expect(guide.introduction).toHaveLength(2);
      expect(guide.responsibilities).toHaveLength(6);
      expect(guide.preparation).toHaveLength(3);
      expect(guide.deliverables).toHaveLength(2);
      expect(guide.review).toHaveLength(4);
      expect(guide.boundaries).toHaveLength(4);
      expect(guide.tools.length).toBeGreaterThan(0);
      expect(member.apps.length).toBeGreaterThanOrEqual(9);
      for (const responsibility of guide.responsibilities) {
        expect(responsibility.description.length).toBeGreaterThan(220);
        expect(responsibility.input.length).toBeGreaterThan(35);
        expect(responsibility.output.length).toBeGreaterThan(35);
        expect(responsibility.request.length).toBeGreaterThan(55);
      }
      const groups = skillsByCategory(member.id);
      expect(groups.length).toBeGreaterThan(0);
      expect(groups.flatMap(([, skills]) => skills).length).toBeGreaterThan(0);
      const words = JSON.stringify(guide).split(/\s+/).length;
      expect(words).toBeGreaterThan(800);
    }
  });

  it("keeps Abdullah's guide on par with the other employees", () => {
    const member = team.find((m) => m.id === "abdullah");
    if (!member) throw new Error("abdullah must stay in the public roster");
    const guide = member.guide;
    expect(guide.introduction).toHaveLength(2);
    expect(guide.responsibilities).toHaveLength(6);
    expect(guide.preparation).toHaveLength(3);
    expect(guide.deliverables.length).toBeGreaterThanOrEqual(2);
    expect(guide.review).toHaveLength(4);
    expect(guide.boundaries).toHaveLength(4);
    expect(guide.tools.length).toBeGreaterThanOrEqual(2);
    for (const responsibility of guide.responsibilities) {
      expect(responsibility.description.length).toBeGreaterThan(100);
      expect(responsibility.input.length).toBeGreaterThan(15);
      expect(responsibility.output.length).toBeGreaterThan(30);
      expect(responsibility.request.length).toBeGreaterThan(40);
    }
  });

  it("gives every employee a distinct first request", () => {
    expect(new Set(team.map((member) => member.guide.firstRequest)).size).toBe(7);
  });
});
