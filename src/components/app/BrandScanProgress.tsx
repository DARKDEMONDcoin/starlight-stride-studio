import { Check, CircleAlert, Globe2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brandStages, type BrandJob } from "@/lib/brand-brain";
export function BrandScanProgress({ job, queuedWebsite, onRetry, onManual }: { job?: BrandJob | null; queuedWebsite?: string; onRetry?: () => void; onManual?: () => void }) {
  const deferred = !job;
  const complete = job?.status === "completed";
  const percent = complete ? 100 : Math.round(((job?.stage ?? 0) / 4) * 100);
  const index = Math.min(3, Math.max(0, job?.stage ?? 0));
  const entry = job?.stages[index]; const stage = brandStages[index];
  const stale = job?.status === "running" && job.lease_until && new Date(job.lease_until).getTime() < Date.now();
  const stopped = stale || ["failed", "paused"].includes(job?.status ?? "") || entry?.state === "failed";
  return <section className="brand-scan" dir="rtl" aria-label="تقدم تحليل الموقع">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{complete ? "تعرفنا على علامتك" : "نتعرّف على علامتك"}</h2><p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Globe2 className="size-4" /><span dir="ltr" className="break-all">{job?.website ?? queuedWebsite}</span></p></div><span className="text-xs text-muted-foreground">{job?.sources.length ?? 0} صفحات مقروءة</span></div>
    <div className="my-5"><div className="mb-2 flex flex-wrap justify-between gap-2 text-xs"><b className="text-primary">اكتمل {percent}٪</b><span className="text-muted-foreground">{complete ? "اكتمل التحليل" : deferred ? "يبدأ التحليل الكامل بعد إنشاء حسابك" : stopped ? "الفحص متوقف · نتائجك محفوظة" : `المرحلة ${index + 1} من 4`}</span></div><progress className="h-1.5 w-full accent-primary" aria-label="تقدم تحليل الموقع" value={percent} max={100} /></div>
    <div className="brand-step is-running" aria-live="polite" aria-atomic="true"><span className="brand-step-icon">{complete ? <Check className="size-5 text-primary" /> : stopped ? <CircleAlert className="size-5 text-destructive" /> : deferred ? <Globe2 className="size-5" /> : <span className="brand-progress-ring" />}</span><div className="min-w-0"><h3 className="font-bold">{complete ? "نتائج التحليل محفوظة" : stage?.label}</h3><p className="mt-2 text-sm text-muted-foreground">{complete ? "راجع بيانات نشاطك قبل استخدامها." : stopped ? entry?.error ?? job?.error ?? "تعذّر إكمال المرحلة. أعد المحاولة." : deferred ? "حفظنا الرابط لتكملة التحليل بعد التسجيل." : entry?.line ?? "جارٍ قراءة الأدلة من موقعك…"}</p>{stopped && <div className="mt-4 flex flex-wrap gap-2">{onRetry && ![402,403].includes(job?.error_status ?? 0) && <Button size="sm" variant="outline" onClick={onRetry}><RotateCcw className="size-4" />إعادة المحاولة</Button>}{onManual && <Button size="sm" variant="ghost" onClick={onManual}>أدخل يدويًا</Button>}</div>}</div></div>
    <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />{deferred ? "لن تحتاج إلى إدخال الرابط مرة أخرى" : "تم حفظ النتائج حتى الآن · يمكنك العودة لاحقًا"}</p>
  </section>;
}
