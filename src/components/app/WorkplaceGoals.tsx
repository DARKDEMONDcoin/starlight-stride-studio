import { useState } from "react";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { goalFromTemplate, type ObjectiveTemplate, type WorkplaceGoal, type WorkplaceKpi } from "@/lib/workplace-setup";

const sources: { value: WorkplaceKpi["source"]; label: string }[] = [{ value: "manual", label: "قياس يدوي" }, { value: "ga4", label: "Google Analytics 4" }, { value: "gsc", label: "Search Console" }, { value: "social", label: "حساب اجتماعي" }];
export function WorkplaceGoals({ owner = "general", templates, goals, onChange, businessGoals = [] }: { owner?: string; templates: ObjectiveTemplate[]; goals: WorkplaceGoal[]; onChange: (goals: WorkplaceGoal[]) => void; businessGoals?: WorkplaceGoal[] }) {
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState<string | null>(goals[0]?.id ?? null);
  const available = [...templates, ...goals.filter((g) => !templates.some((t) => t.id === g.id)).map((g) => ({ id: g.id, industry: "", title: g.title, hint: "هدف مخصص", unit: g.kpis[0]?.unit ?? "عدد", source: g.kpis[0]?.source ?? "manual" as const }))];
  const update = (goal: WorkplaceGoal) => onChange(goals.map((g) => g.id === goal.id ? goal : g));
  const updateKpi = (goal: WorkplaceGoal, id: string, patch: Partial<WorkplaceKpi>) => update({ ...goal, kpis: goal.kpis.map((k) => k.id === id ? { ...k, ...patch } : k) });
  return <div className="space-y-3 workplace-fields">
    {available.map((t) => {
      const goal = goals.find((g) => g.id === t.id); const expanded = Boolean(goal && open === t.id);
      return <article key={t.id} className={cn("workplace-goal", goal && "is-selected")}>
        <div className="flex items-center gap-3 p-4">
          <input type="checkbox" className="size-5 shrink-0 accent-primary" aria-label={`اختيار ${t.title}`} checked={Boolean(goal)} onChange={() => { if (goal) onChange(goals.filter((g) => g.id !== t.id)); else { onChange([...goals, goalFromTemplate(t, owner)]); setOpen(t.id); } }} />
          <div className="min-w-0 flex-1"><h3 className="text-sm font-bold">{t.title}</h3><p className="mt-1 text-xs text-muted-foreground">{t.hint}</p></div>
          {goal && <Button variant="ghost" size="icon" title="تعديل مؤشرات الأداء" aria-label={`مؤشرات ${t.title}`} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : t.id)}><ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} /></Button>}
        </div>
        {goal && expanded && <div className="space-y-4 border-t border-border bg-primary/5 p-4">
          {owner !== "general" && <label className="workplace-label">يدعم هدف النشاط<select className="workplace-input" value={goal.businessGoalId ?? ""} onChange={(e) => update({ ...goal, businessGoalId: e.target.value || undefined })}><option value="">اختر هدفًا</option>{businessGoals.map((g) => <option value={g.id} key={g.id}>{g.title}</option>)}</select></label>}
          {goal.kpis.map((k, i) => <div key={k.id} className="space-y-3">
            <div className="flex items-center justify-between"><p className="text-xs font-bold">مؤشر الأداء {i + 1}</p>{goal.kpis.length > 1 && <Button size="icon" variant="ghost" aria-label="حذف المؤشر" title="حذف المؤشر" onClick={() => update({ ...goal, kpis: goal.kpis.filter((x) => x.id !== k.id) })}><Trash2 className="size-4" /></Button>}</div>
            <div className="grid gap-3 sm:grid-cols-2"><label className="workplace-label">المؤشر<Input value={k.measure} maxLength={120} onChange={(e) => updateKpi(goal, k.id, { measure: e.target.value })} /></label><label className="workplace-label">الوحدة<Input value={k.unit} maxLength={60} onChange={(e) => updateKpi(goal, k.id, { unit: e.target.value })} /></label></div>
            <div className="grid gap-3 sm:grid-cols-2"><label className="workplace-label">مصدر القياس<select className="workplace-input" value={k.source} onChange={(e) => updateKpi(goal, k.id, { source: e.target.value as WorkplaceKpi["source"] })}>{sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}{!sources.some((s) => s.value === k.source) && <option value={k.source}>{k.source === "ads" ? "بيانات إعلانية موثّقة" : "قياس يدوي بعد المراجعة"}</option>}</select></label><label className="workplace-label">دورية المراجعة<select className="workplace-input" value={k.review} onChange={(e) => updateKpi(goal, k.id, { review: e.target.value as WorkplaceKpi["review"] })}><option value="weekly">أسبوعيًا</option><option value="monthly">شهريًا</option></select></label></div>
            <label className="workplace-label">القيمة المستهدفة<Input aria-label={`القيمة المستهدفة ${k.measure}`} value={k.target} placeholder="بعد مراجعة خط الأساس" inputMode="decimal" maxLength={12} onChange={(e) => updateKpi(goal, k.id, { target: e.target.value.replace(/[^0-9.]/g, "") })} /></label>
            <p className="text-xs text-muted-foreground">خط الأساس غير محدد بعد · {k.source === "manual" ? "تُسجّل القراءة عند توفر دليل." : "بانتظار بيانات الحساب المتصل."}</p>
          </div>)}
          <Button size="sm" variant="ghost" disabled={goal.kpis.length >= 5} onClick={() => update({ ...goal, kpis: [...goal.kpis, { id: crypto.randomUUID(), measure: "مؤشر إضافي", unit: "عدد", target: "", source: "manual", review: "monthly", baseline: null }] })}><Plus className="size-4" />أضف مؤشرًا</Button>
        </div>}
      </article>;
    })}
    <form className="flex flex-wrap gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); if (!custom.trim()) return; const id = `custom-${crypto.randomUUID()}`; onChange([...goals, goalFromTemplate({ id, title: custom.trim(), hint: "هدف مخصص", unit: "عدد", source: "manual", industry: "" }, owner)]); setOpen(id); setCustom(""); }}><Input className="min-w-0 flex-1" aria-label="هدف مخصص" placeholder="اكتب هدفك الخاص…" value={custom} maxLength={160} onChange={(e) => setCustom(e.target.value)} /><Button type="submit" variant="outline" disabled={!custom.trim()}><Plus className="size-4" />أضف هدفًا</Button></form>
    {goals.length > 0 && <p className="flex items-center gap-2 text-xs text-primary"><Check className="size-4" />{goals.length} أهداف محددة · {goals.reduce((n, g) => n + g.kpis.length, 0)} مؤشرات أداء</p>}
  </div>;
}