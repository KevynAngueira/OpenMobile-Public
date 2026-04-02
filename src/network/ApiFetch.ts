import { DevFlags } from "../DevConsole/configs/DevFlagsConfig";

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  extraHeaders: Record<string, string> = {}
): Promise<Response> {

  const headers = new Headers(options.headers || {});

  const store = DevFlags.isEnabled("useDevStorage")
    ? "dev"
    : "prod";
  headers.set("X-Storage-Env", store);

  const defo_mode = DevFlags.isEnabled("useLeafMatching")
    ? "match"
    : "area";
  headers.set("X-Model-Type", defo_mode);

  // Inject dynamic headers
  Object.entries(extraHeaders).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      headers.set(key, String(value));
    }
  });

  return fetch(url, {
    ...options,
    headers,
  });
}