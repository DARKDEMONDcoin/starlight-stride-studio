import { describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  const chain = { middleware: () => chain, inputValidator: () => chain, handler: (fn: unknown) => fn };
  return chain;
} }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { saveWorkplaceSetup } from "@/lib/workplace-setup.functions";
import { emptyWorkplace, goalFromTemplate, type WorkplaceSetup } from "@/lib/workplace-setup";
type Handler = (input: { data: { workspaceId: string; setup: WorkplaceSetup }; context: unknown }) => Promise<WorkplaceSetup>;
describe("optional setup integrations", () => {
  for (const source of ["social", "ga4", "gsc", "ads"] as const) it(`saves ready and complete ${source} goals without reading connections`, async () => {
    const general = goalFromTemplate({ id: "business", title: "Grow business", unit: "count", hint: "", industry: "", source });
    const own = { ...general, id: "employee", owner: "dana" };
    for (const stage of ["ready", "complete"] as const) {
      const setup: WorkplaceSetup = { ...emptyWorkplace(), stage, goals: [general, own], employees: ["dana"], completedSteps: ["objectives", "employees", "tools"] };
      const from = vi.fn(() => { throw new Error("Integration service unavailable"); });
      const rpc = vi.fn().mockResolvedValue({ data: { ...setup, revision: 1 }, error: null });
      const saved = await (saveWorkplaceSetup as unknown as Handler)({ data: { workspaceId: "workspace", setup }, context: { supabase: { from, rpc } } });
      expect(saved.stage).toBe(stage);
      expect(saved.goals[0]?.kpis[0]?.source).toBe(source);
      expect(saved.goals[0]?.kpis[0]?.baseline).toBeNull();
      expect(from).not.toHaveBeenCalled();
      expect(rpc).toHaveBeenCalledWith("save_workplace_setup", { p_workspace: "workspace", p_setup: setup, p_expected_revision: 0 });
    }
  });
});