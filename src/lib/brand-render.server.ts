import { getSecrets } from "./secrets.server";
import { createBrowserSession } from "./browser-session.server";
import { BrandScanError, brandSameSite, readBrandPublic } from "./brand-scan.server";
import { robotsAllows } from "./brand-brain";

/** Browser navigation never fetches target resources itself: fulfill through the pinned reader. */
export async function renderBrandPage(url: string, origin: string): Promise<string> {
  const robots = (await readBrandPublic(`${origin}/robots.txt`, origin, "text")).body;
  const secrets = await getSecrets(["BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID"] as const);
  const key = secrets.BROWSERBASE_API_KEY, projectId = secrets.BROWSERBASE_PROJECT_ID;
  if (!key || !projectId) throw new BrandScanError("الموقع يحتاج متصفحًا لقراءة محتواه؛ خدمة المتصفح غير متاحة الآن.");
  const session = await createBrowserSession(key, { projectId, timeout: 60 });
  const ws = new WebSocket(session.connectUrl);
  let id = 0, reads = 0;
  const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  const deadline = Date.now() + 25_000;
  const send = (method: string, params: Record<string, unknown> = {}, sessionId?: string) => new Promise<any>((resolve, reject) => {
    const current = ++id;
    pending.set(current, { resolve, reject });
    ws.send(JSON.stringify({ id: current, method, params, ...(sessionId ? { sessionId } : {}) }));
    setTimeout(() => { if (pending.delete(current)) reject(new BrandScanError("انتهت مهلة المتصفح.")); }, Math.max(1, deadline - Date.now()));
  });
  let attached: string | undefined;
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (typeof message.id === "number") {
      const entry = pending.get(message.id); pending.delete(message.id);
      if (message.error) entry?.reject(new BrandScanError("تعذّر قراءة الموقع في المتصفح.")); else entry?.resolve(message.result);
    } else if (message.method === "Fetch.requestPaused" && attached) {
      const { requestId, request, resourceType } = message.params;
      const sessionId = attached;
      void (async () => {
        try {
          if (request.method !== "GET" || !brandSameSite(request.url, origin) || !robotsAllows(robots, new URL(request.url).pathname) || ++reads > 30 || Date.now() >= deadline || !["Document", "Script", "Stylesheet", "XHR", "Fetch"].includes(resourceType)) throw new Error("blocked");
          const kind = resourceType === "Document" ? "html" : resourceType === "Stylesheet" ? "css" : "resource";
          const response = await readBrandPublic(request.url, origin, kind);
          await send("Fetch.fulfillRequest", { requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: response.contentType }, { name: "Access-Control-Allow-Origin", value: origin }], body: Buffer.from(response.body).toString("base64") }, sessionId);
        } catch (error) { console.warn("Brand browser resource blocked", { type: resourceType, path: new URL(request.url).pathname, reason: error instanceof Error ? error.message : "blocked" }); await send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" }, sessionId).catch(() => {}); }
      })();
    }
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new BrandScanError("تعذّر الاتصال بالمتصفح.")), 10_000);
      ws.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener("error", () => { clearTimeout(timer); reject(new BrandScanError("تعذّر الاتصال بالمتصفح.")); }, { once: true });
    });
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const result = await send("Target.attachToTarget", { targetId, flatten: true });
    attached = result.sessionId;
    await send("Network.enable", {}, attached);
    await send("Network.setBypassServiceWorker", { bypass: true }, attached);
    await send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] }, attached);
    await send("Page.enable", {}, attached);
    await send("Page.navigate", { url }, attached);
    while (Date.now() < deadline - 1000) {
      await new Promise((resolve) => setTimeout(resolve, 750));
      const result = await send("Runtime.evaluate", { expression: "JSON.stringify({url:location.href,text:document.body?.innerText||'',html:document.documentElement.outerHTML})", returnByValue: true }, attached);
      const page = JSON.parse(result?.result?.value ?? "{}");
      if (page.url === "about:blank") continue;
      if (!brandSameSite(page.url ?? url, origin)) { console.warn("Brand rendered navigation rejected", { url: page.url }); throw new BrandScanError("إعادة توجيه غير آمنة أو خارج الموقع."); }
      if ((page.text?.trim().length ?? 0) >= 100 && typeof page.html === "string") {
        if (Buffer.byteLength(page.html) > 1_048_576) throw new BrandScanError("الصفحة أكبر من حد القراءة الآمنة.");
        return page.html;
      }
    }
    throw new BrandScanError("لم يعرض الموقع محتوى عامًا قابلًا للقراءة؛ يمكنك إدخال المعلومات يدويًا.");
  } finally {
    ws.close();
    for (const entry of pending.values()) entry.reject(new BrandScanError("انتهت جلسة القراءة."));
    pending.clear();
    await fetch(`https://api.browserbase.com/v1/sessions/${session.id}`, { method: "POST", headers: { "X-BB-API-Key": key, "Content-Type": "application/json" }, body: JSON.stringify({ projectId, status: "REQUEST_RELEASE" }), signal: AbortSignal.timeout(5000) }).catch(() => {});
  }
}