/**
 * Centralized API utility for the HRMS Mobile App.
 * Tries multiple backend endpoints so the app works on
 * physical devices (LAN IP), Android emulators (10.0.2.2),
 * and iOS simulators (localhost / 127.0.0.1).
 */

const CANDIDATE_BASES = [
  "http://192.168.1.34:5000",
  "http://10.0.2.2:5000",      // Android emulator loopback
  "http://127.0.0.1:5000",
  "http://localhost:5000",
];

let _resolvedBase: string | null = null;

/**
 * Probe each candidate base URL and cache the first responsive one.
 * Falls back to the LAN IP if all probes time-out (avoids hanging forever).
 */
async function resolveBaseUrl(): Promise<string> {
  if (_resolvedBase) return _resolvedBase;

  for (const base of CANDIDATE_BASES) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${base}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok || res.status < 500) {
        _resolvedBase = base;
        return _resolvedBase;
      }
    } catch {
      // try next
    }
  }

  // Default fallback
  _resolvedBase = CANDIDATE_BASES[0];
  return _resolvedBase;
}

/** Reset cached base (useful after network changes) */
export function resetBaseUrl() {
  _resolvedBase = null;
}

/**
 * Authenticated fetch wrapper.
 * @param path   e.g. "/api/admin/pending-requests"
 * @param token  JWT bearer token
 * @param init   Additional fetch options (method, body, etc.)
 */
export async function apiFetch(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<Response> {
  const base = await resolveBaseUrl();
  const url = `${base}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  return fetch(url, { ...init, headers });
}
