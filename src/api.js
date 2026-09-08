import { analyzeText } from "./analysis/engine.js";

const BACKEND_URL = (import.meta.env.VITE_SCAMSHIELD_API_URL || "").trim() || "/api/analyze";

export function isConfigured() {
  return Boolean(BACKEND_URL);
}

/**
 * Analyze a message.
 *
 * - If VITE_SCAMSHIELD_API_URL is set, the message is sent to a secure backend
 *   (future: Netlify -> backend -> Qwen3-30B). The browser never holds a token.
 * - Otherwise, analysis runs entirely client-side with ScamShield's rule-based
 *   Pattern Engine. No network request, no token, fully static-hostable.
 */
export async function analyzeMessage(message) {
  if (BACKEND_URL) {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [message] }),
    });
    if (!res.ok) throw new Error("Backend analysis failed.");
    const json = await res.json();
    if (json && json.error) return json;
    if (json && Array.isArray(json.data) && json.data.length) return json.data[0];
    return json;
  }
  return analyzeText(message);
}
