import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { WelcomeAnalysisEvent } from "@/lib/welcome-analysis";

/** Anonymous public evidence only; no account data or privileged writes. */
export const Route = createFileRoute("/api/public/welcome-analysis")({ server: { handlers: { POST: async ({ request }) => {
  const parsed = z.object({ url: z.string().trim().min(4).max(300) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("Invalid website", { status: 400 });
  const { runWelcomeAnalysis } = await import("@/lib/welcome-analysis.server");
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: WelcomeAnalysisEvent) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); } catch { closed = true; }
      };
      void runWelcomeAnalysis(parsed.data.url, request, (stage) => send({ type: "progress", stage }))
        .then((result) => send({ type: "done", result }))
        .catch((error) => send({ type: "error", message: error instanceof Error ? error.message : "تعذّر تحليل الموقع. أعد المحاولة أو تابع دون موقع." }))
        .finally(() => { if (!closed) { closed = true; controller.close(); } });
    },
    cancel() { closed = true; },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Content-Type-Options": "nosniff" } });
} } } });