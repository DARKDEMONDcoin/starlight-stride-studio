import { z } from "zod";
import { employeeSetups, generalObjectivesFor, type SavedOnboarding, type SavedObjective } from "./onboarding-objectives";

export const kpiSchema = z.object({ id: z.string().max(80), measure: z.string().trim().min(1).max(120), unit: z.string().trim().min(1).max(60), target: z.string().max(12), review: z.enum(["weekly", "monthly"]), source: z.enum(["ga4", "gsc", "ads", "social", "tasks", "manual"]), baseline: z.null().default(null) });
export const goalSchema = z.object({ id: z.string().max(80), owner: z.string().max(30), title: z.string().trim().min(1).max(160), businessGoalId: z.string().max(80).optional(), kpis: z.array(kpiSchema).min(1).max(5) });
export const workplaceSchema = z.object({ version: z.literal(2), revision: z.number().int().nonnegative(), stage: z.enum(["objectives", "employees", "tools", "ready", "complete"]), industry: z.string().max(120), goals: z.array(goalSchema).max(40), employees: z.array(z.string().max(30)).max(7), completedSteps: z.array(z.enum(["objectives", "employees", "tools"])).max(3), completedAt: z.string().optional() });
export type WorkplaceSetup = z.infer<typeof workplaceSchema>;
export type WorkplaceGoal = z.infer<typeof goalSchema>;
export type WorkplaceKpi = z.infer<typeof kpiSchema>;
export type ObjectiveTemplate = { id: string; industry: string; title: string; hint: string; unit: string; source: WorkplaceKpi["source"] };

export function emptyWorkplace(industry = ""): WorkplaceSetup { return { version: 2, revision: 0, stage: "objectives", industry, goals: [], employees: [], completedSteps: [] }; }
export function readWorkplace(profile: unknown): WorkplaceSetup | null { const result = workplaceSchema.safeParse((profile as { workplaceSetup?: unknown } | null)?.workplaceSetup); return result.success ? result.data : null; }
export function goalFromTemplate(template: ObjectiveTemplate, owner = "general"): WorkplaceGoal { return { id: template.id, owner, title: template.title, kpis: [{ id: `${template.id}-kpi`, measure: template.title, unit: template.unit, target: "", review: "monthly", source: template.source, baseline: null }] }; }
export function employeeGoals(id: string): WorkplaceGoal[] { return (employeeSetups[id]?.objectives ?? []).map((o) => goalFromTemplate({ ...o, industry: "" }, id)); }
export function validGoal(goal: WorkplaceGoal): boolean { return goal.title.trim().length > 0 && goal.kpis.length > 0 && goal.kpis.every((k) => k.measure.trim() && k.unit.trim() && (!k.target || (Number.isFinite(Number(k.target)) && Number(k.target) > 0))); }

const goalEmployees: Record<string, string[]> = { traffic: ["nour", "adam"], leads: ["sam", "sonny"], sales: ["sam", "adam"], awareness: ["sonny", "dana"], time: ["eva"], orders: ["sam", "sonny", "adam"], cart: ["sam", "adam"], repeat: ["sam", "sonny"], appointments: ["sam", "eva"], bookings: ["sam", "sonny"], inquiries: ["sam", "sonny"], reviews: ["sonny"], listings: ["sonny", "dana"], enrollments: ["sam", "sonny"], signups: ["nour", "adam"], blogs: ["nour"], launch: ["sonny", "dana"], consults: ["sam"] };
export function recommendedEmployees(goals: WorkplaceGoal[]): { id: string; goals: WorkplaceGoal[] }[] { const general = goals.filter((g) => g.owner === "general"); const ids = [...new Set(general.flatMap((g) => goalEmployees[g.id] ?? ["eva"]))]; return ids.map((id) => ({ id, goals: general.filter((g) => (goalEmployees[g.id] ?? ["eva"]).includes(id)) })); }
export type ToolRequirement = { key: string; providers: string[]; reason: string };
export function requiredTools(setup: WorkplaceSetup): ToolRequirement[] {
  const goals = setup.goals; const out: ToolRequirement[] = [];
  const add = (key: string, providers: string[], reason: string) => { if (!out.some((x) => x.key === key)) out.push({ key, providers, reason }); };
  for (const goal of goals) for (const k of goal.kpis) {
    if (k.source === "ga4") add("analytics", ["analytics"], "قياس زيارات الموقع والتحويلات");
    if (k.source === "gsc") add("search", ["search-console"], "قياس الظهور والنقرات من البحث");
    if (k.source === "social") add("social", ["instagram", "facebook", "linkedin", "x"], "قياس الحساب الاجتماعي المختار");
    if (k.source === "ads") add("ads", [], "اتصال إعلاني موثّق غير متاح حاليًا؛ راجع الهدف أو اختر مهمة تحضير دون بيانات إعلانية");
  }
  if (goals.some((g) => g.owner === "eva" && g.id === "inbox")) add("email", ["gmail", "outlook"], "تنظيم البريد والردود");
  return out;
}
export function toolsReady(setup: WorkplaceSetup, connections: { provider: string; status: string; account?: string | null }[]): boolean { return requiredTools(setup).every((t) => t.providers.some((p) => connections.some((c) => c.provider === p && c.status === "connected" && (p !== "analytics" || Boolean(c.account?.startsWith("GA4 · ")))))); }
export function canFinish(setup: WorkplaceSetup, connections: { provider: string; status: string; account?: string | null }[]): boolean { return setup.completedSteps.includes("objectives") && setup.completedSteps.includes("employees") && setup.employees.length > 0 && setup.goals.filter((g) => g.owner === "general").some(validGoal) && setup.employees.every((e) => setup.goals.some((g) => g.owner === e && validGoal(g))) && toolsReady(setup, connections); }
export function needsWorkplaceSetup(profile: unknown, createdAt: string): boolean { const s = readWorkplace(profile); if (s) return s.stage !== "complete"; const legacy = (profile as { onboarding?: SavedOnboarding } | null)?.onboarding; return !legacy && Date.parse(createdAt) >= Date.parse("2026-10-31T00:00:00Z"); }
export function onboardingFromWorkplace(setup: WorkplaceSetup, previous?: SavedOnboarding | null): SavedOnboarding {
  const objectives: SavedObjective[] = setup.goals.flatMap((g) => g.kpis.map((k) => ({ id: `${g.id}-${k.id}`, owner: g.owner, title: `${g.title} · ${k.measure}`, unit: k.unit, target: k.target, horizon: "3m" as const, source: k.source })));
  return { version: 1, completedAt: setup.completedAt ?? "", objectives, employees: setup.employees, answers: previous?.answers ?? {} };
}
const firstTasks: Record<string, { title: string; output: string; scope: string }> = {
  sam: { title: "راجع فرص العملاء وحدد أولويات المتابعة", output: "قائمة أولويات ومسودات متابعة", scope: "راجع معلومات العملاء المتاحة وحدد الفرص دون إرسال أي رسائل." },
  sonny: { title: "جهّز خطة محتوى للأسبوع الأول", output: "خطة محتوى ومسودات منشورات", scope: "جهّز خطة لسبعة أيام مرتبطة بالأهداف والجمهور، دون نشر." },
  nour: { title: "حدد فرص البحث والمحتوى الأولى", output: "قائمة فرص بحث ومحتوى مرتبة", scope: "راجع سياق النشاط والأدلة المتاحة واقترح أولويات البحث دون اختلاق ترتيب أو زيارات." },
  dana: { title: "جهّز أول موجز تصميم", output: "موجز تصميم مرتبط بالهوية والأهداف", scope: "راجع الهوية المحفوظة وجهّز موجزًا لأول مادة بصرية." },
  adam: { title: "راجع مصادر القياس وخطوط الأساس", output: "تقرير مصادر القياس والفجوات", scope: "راجع المصادر المتصلة المتاحة فعليًا؛ أبقِ خطوط الأساس غير المتاحة مجهولة." },
  eva: { title: "رتّب أولويات الأسبوع الأول", output: "خطة أسبوعية بأولويات واضحة", scope: "رتّب أهداف النشاط وأهداف الفريق في خطة قابلة للمراجعة." },
  abdullah: { title: "راجع جاهزية الإعلانات", output: "مراجعة جاهزية مبنية على الأدلة", scope: "راجع المدخلات والأدلة المتاحة فقط؛ لا تنشئ أو تطلق حملة ولا تتجاوز قيود الإثبات." },
};
export function suggestedFirstTask(setup: WorkplaceSetup, employeeId: string, business: { name: string; industry?: string | null }) {
  const task = firstTasks[employeeId] ?? firstTasks["eva"]; if (!task) return null;
  const own = setup.goals.filter((g) => g.owner === employeeId); const selectedIds = new Set(own.map((g) => g.businessGoalId).filter(Boolean));
  const general = setup.goals.filter((g) => g.owner === "general" && (!selectedIds.size || selectedIds.has(g.id)));
  return { ...task, general, own, prompt: `${task.scope}\nالنشاط: ${business.name}؛ القطاع: ${business.industry ?? setup.industry}.\nأهداف النشاط: ${general.map((g) => g.title).join("، ")}.\nأهدافك: ${own.map((g) => g.title).join("، ")}.\nالمخرج المطلوب: ${task.output}. استخدم سياق النشاط المحفوظ وفق إعداد استخدام الموقع. لا تدّعِ بيانات أو تقدمًا غير موثّق. أي نشر أو إرسال أو تعديل خارجي يحتاج موافقة منفصلة.` };
}

export function localObjectiveTemplates(industry: string): ObjectiveTemplate[] { return generalObjectivesFor(industry).map((o) => ({ ...o, industry })); }