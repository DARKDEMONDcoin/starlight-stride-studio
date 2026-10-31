import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { workplaceSchema, canFinish, validGoal, type ObjectiveTemplate } from "./workplace-setup";

export const objectiveCatalog = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: { industry: string }) => z.object({ industry: z.string().max(120) }).parse(input)).handler(async ({ data, context }) => {
  const { data: rows, error } = await context.supabase.from("industry_objective_templates").select("industry,objectives").in("industry", ["*", data.industry]);
  if (error) throw new Error("تعذّر تحميل اقتراحات القطاع. أعد المحاولة.");
  const ordered = [...(rows ?? [])].sort((a, b) => Number(a.industry === "*") - Number(b.industry === "*"));
  const schema = z.object({ id: z.string(), title: z.string(), hint: z.string(), unit: z.string(), source: z.enum(["ga4", "gsc", "ads", "social", "tasks", "manual"]) });
  const out: ObjectiveTemplate[] = [];
  for (const row of ordered) for (const raw of Array.isArray(row.objectives) ? row.objectives : []) { const r = schema.safeParse(raw); if (r.success && !out.some((o) => o.id === r.data.id)) out.push({ ...r.data, industry: row.industry }); }
  return out;
});

export const saveWorkplaceSetup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid(), setup: workplaceSchema }).parse(input)).handler(async ({ data, context }) => {
  const setup = data.setup;
  if (setup.goals.some((g) => !validGoal(g))) throw new Error("راجع اسم المؤشر ووحدته والقيمة المستهدفة.");
  if (["ready", "complete"].includes(setup.stage)) {
    const { data: integrations, error } = await context.supabase.from("integrations").select("provider,status,account").eq("workspace_id", data.workspaceId);
    if (error || !canFinish(setup, integrations ?? [])) throw new Error("أكمل الأهداف والتوظيف واربط الأدوات الأساسية أولًا.");
  }
  const { data: saved, error } = await context.supabase.rpc("save_workplace_setup", { p_workspace: data.workspaceId, p_setup: setup as never, p_expected_revision: setup.revision });
  if (error) throw new Error(error.message.includes("another session") ? "تغيّر الإعداد في جلسة أخرى. أعد تحميل الصفحة قبل الحفظ." : "تعذّر حفظ الإعداد. اختياراتك ما زالت هنا؛ أعد المحاولة.");
  return workplaceSchema.parse(saved);
});

export const saveNewWorkplaceContext = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid(), welcome: z.object({ website: z.string().max(600).optional(), industry: z.string().max(120).optional(), purpose: z.string().max(40).optional() }) }).parse(input)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.rpc("save_new_workspace_context", { p_workspace: data.workspaceId, p_context: data.welcome });
  if (error) throw new Error("تعذّر حفظ سياق البداية.");
  return { ok: true };
});