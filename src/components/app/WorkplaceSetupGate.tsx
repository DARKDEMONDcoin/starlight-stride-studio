import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useWorkspace } from "@/lib/data";
import { needsWorkplaceSetup } from "@/lib/workplace-setup";

export function WorkplaceSetupGate({ children }: { children: ReactNode }) {
  const { data: workspace, isLoading } = useWorkspace();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const required = Boolean(workspace && needsWorkplaceSetup(workspace.profile, workspace.created_at));
  const allowed = ["/app/setup", "/app/integrations", "/app/brand", "/app/help", "/app/settings"].some((p) => path === p || path.startsWith(`${p}/`));
  useEffect(() => { if (required && !allowed) void navigate({ to: "/app/setup", replace: true }); }, [required, allowed, navigate]);
  if (isLoading || (required && !allowed)) return <p role="status" className="p-8 text-center text-sm text-muted-foreground">جارٍ فتح إعداد مساحة العمل…</p>;
  return <>{children}</>;
}