import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useWorkspace } from "@/lib/data";
import { needsWorkplaceSetup } from "@/lib/workplace-setup";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { boundWelcomeUser, clearWelcomeBinding, readWelcomeDraft } from "@/lib/welcome-draft";
import { supabase } from "@/integrations/supabase/client";
import { saveNewWorkplaceContext } from "@/lib/workplace-setup.functions";

export function WorkplaceSetupGate({ children }: { children: ReactNode }) {
  const { data: workspace, isLoading } = useWorkspace();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const saveContext = useServerFn(saveNewWorkplaceContext);
  const qc = useQueryClient();
  useEffect(() => {
    if (!workspace || (workspace.profile as { welcome?: unknown } | null)?.welcome) return;
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user || boundWelcomeUser() !== data.user.id || Date.now() - Date.parse(data.user.created_at) > 10 * 60 * 1000) return;
      const draft = readWelcomeDraft(); if (!draft) return;
      await saveContext({ data: { workspaceId: workspace.id, welcome: { website: draft.website, industry: draft.industry, purpose: draft.purpose } } });
      clearWelcomeBinding(); await qc.invalidateQueries({ queryKey: ["workspace"] });
    }).catch(() => { /* Keep the bound draft for retry; never block account access. */ });
    return () => { active = false; };
  }, [workspace?.id, saveContext, qc]);
  const required = Boolean(workspace && needsWorkplaceSetup(workspace.profile, workspace.created_at));
  const allowed = ["/app/setup", "/app/integrations", "/app/brand", "/app/help", "/app/settings"].some((p) => path === p || path.startsWith(`${p}/`));
  useEffect(() => { if (required && !allowed) void navigate({ to: "/app/setup", replace: true }); }, [required, allowed, navigate]);
  if (isLoading || (required && !allowed)) return <p role="status" className="p-8 text-center text-sm text-muted-foreground">جارٍ فتح إعداد مساحة العمل…</p>;
  return <>{children}</>;
}