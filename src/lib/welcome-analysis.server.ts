import { publicWebsiteUrl } from "./welcome-preview.server";
import { analyzeWebsite, cachedAnalysis } from "./welcome-understand.server";
import { isRateLimited, requestIdentifier } from "./rate-limit.server";

const attempts = new Map<string, { count: number; expires: number }>();
const LIMIT = 8;
/** Both public entry points share the same validation, cache and visitor budget. */
export async function runWelcomeAnalysis(raw: string, request: Request, onProgress?: (stage: number) => void) {
  const target = publicWebsiteUrl(raw);
  if (!target) throw new Error("أدخل رابط موقع عام صالح، مثل example.com");
  const cached = cachedAnalysis(target.hostname.replace(/^www\./, ""));
  if (cached) return cached;
  const id = requestIdentifier(request), now = Date.now();
  const entry = attempts.get(id);
  if (attempts.size > 5000) for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
  const message = "وصلت إلى حد الفحص خلال هذه الساعة. حاول لاحقًا أو تابع دون موقع.";
  if (entry && entry.expires > now && entry.count >= LIMIT) throw new Error(message);
  attempts.set(id, { count: (entry && entry.expires > now ? entry.count : 0) + 1, expires: entry && entry.expires > now ? entry.expires : now + 3600_000 });
  if (await isRateLimited("welcome-preview", id, LIMIT, 3600)) throw new Error(message);
  return analyzeWebsite(target.toString(), onProgress);
}