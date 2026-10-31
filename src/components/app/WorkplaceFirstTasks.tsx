import { Link } from "@tanstack/react-router";
import { ArrowLeft, Target } from "lucide-react";
import { team } from "@/data/team";
import { Portrait } from "@/components/site/Portrait";
import { Button } from "@/components/ui/button";
import { employeeSlug } from "@/lib/employee-slugs";
import { suggestedFirstTask, type WorkplaceSetup } from "@/lib/workplace-setup";
import "./workplace-setup.css";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { workplaceFirstTaskStatus } from "@/lib/workplace-setup.functions";

export function WorkplaceFirstTasks({ setup, business }: { setup: WorkplaceSetup; business: { id: string; name: string; industry?: string | null } }) {
  const loadStatus = useServerFn(workplaceFirstTaskStatus);
  const status = useQuery({ queryKey: ["workplace-first-tasks", business.id], queryFn: () => loadStatus({ data: { workspaceId: business.id } }) });
  return <section className="workplace mb-8" aria-labelledby="first-tasks-title"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5"><div><h2 id="first-tasks-title" className="text-xl font-bold">اختر أول مهمة لفريقك</h2><p className="mt-2 text-sm text-muted-foreground">مهام مقترحة بناءً على أهداف {business.name} وأهداف موظفيك.</p></div><Button variant="outline" asChild><Link to="/app/setup" search={{ step: "employees" }}>عيّن موظفًا آخر</Link></Button></header><div>{setup.employees.map((id) => { const m = team.find((x) => x.id === id); const task = suggestedFirstTask(setup, id, business); if (!m || !task) return null; return <article key={id} className="workplace-row"><Portrait memberId={id} name={m.name} className="size-12 rounded-full" /><div className="grow"><p className="text-xs text-muted-foreground">{m.name} · {m.role}</p><h3 className="mt-1 text-sm font-bold">{task.title}</h3><p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground"><Target className="size-3.5 shrink-0" />{task.general.map((g) => g.title).join("، ")}</p><p className="mt-2 text-xs text-muted-foreground">المخرج: {task.output}</p></div><div className="space-y-3"><p className="text-xs text-muted-foreground">{status.isPending ? "جارٍ قراءة الحالة…" : status.error ? "الحالة غير متاحة" : status.data?.includes(id) ? "بدأت · افتح المحادثة للمتابعة" : "مقترحة · لم تبدأ"}</p><Button variant="outline" asChild><Link to="/app/chat/$id" params={{ id: employeeSlug(id) }} search={{ starter: !status.data?.includes(id) }}>{status.data?.includes(id) ? "افتح المحادثة" : "راجع المهمة"}<ArrowLeft className="size-4" /></Link></Button></div></article>; })}</div></section>;
}