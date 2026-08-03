/**
 * Auto-detect and manage Backend API Base URL for local development and production.
 */

const DEFAULT_BACKEND_PORTS = [5000, 5001, 8000, 3000, 8080];
let cachedApiBaseUrl: string | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  // 1. Respect explicitly defined env variable
  if (import.meta.env.VITE_API_BASE_URL) {
    cachedApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    return cachedApiBaseUrl;
  }

  // 2. Probe localhost ports automatically
  for (const port of DEFAULT_BACKEND_PORTS) {
    const candidateUrl = `http://localhost:${port}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      const res = await fetch(`${candidateUrl}/api/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        console.log(`[API Config] Automatically detected backend API at: ${candidateUrl}`);
        cachedApiBaseUrl = candidateUrl;
        return candidateUrl;
      }
    } catch {
      // Continue checking next candidate port
    }
  }

  // 3. Default fallback
  const fallbackUrl = "https://skincare-backend-9xia.onrender.com";
  cachedApiBaseUrl = fallbackUrl;
  return fallbackUrl;
}

export function resetApiBaseUrlCache() {
  cachedApiBaseUrl = null;
}
