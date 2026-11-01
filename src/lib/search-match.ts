const aliases: Record<string, string> = {
  analytics: "Google Analytics GA4", calendar: "Google Calendar", sheets: "Google Sheets", drive: "Google Drive",
  "search-console": "Google Search Console GSC", "google-ads": "Google Ads", "google-account": "Google Account", "meta-ads": "Meta Facebook Ads",
};
export function searchMatches(query: string, ...values: (string | null | undefined)[]): boolean {
  const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g, "").toLowerCase().trim();
  const needle = normalize(query);
  return !needle || values.some((value) => value && normalize(`${value} ${aliases[value] ?? ""}`).includes(needle));
}