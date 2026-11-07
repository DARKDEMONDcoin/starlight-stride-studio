import type { WelcomePreview } from "./welcome-preview.server";

export const welcomeAnalysisStages = ["قراءة موقعك", "اكتشاف الخدمات والمنتجات", "استخراج الهوية ووسائل التواصل", "فهم نشاطك وجمهورك"] as const;
export type WelcomeAnalysisEvent = { type: "progress"; stage: number } | { type: "done"; result: WelcomePreview } | { type: "error"; message: string };

/** Consume real server checkpoints, including frames split across network chunks. */
export async function readWelcomeAnalysis(response: Response, onProgress: (stage: number) => void): Promise<WelcomePreview> {
  if (!response.ok || !response.body) throw new Error("تعذّر بدء التحليل. أعد المحاولة.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line) as WelcomeAnalysisEvent;
        if (event.type === "progress") onProgress(event.stage);
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "done") return event.result;
      }
      if (done) throw new Error("انقطع التحليل قبل اكتماله. أعد المحاولة.");
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}