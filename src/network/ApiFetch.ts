import { DevFlags } from "../DevConsole/configs/DevFlagsConfig";
import { CollectorIdentityService } from "../DevConsole/services/CollectorIdentityService";

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

  headers.set(
    "X-Request-Timestamp",
    new Date().toISOString()
  );

  const identity = await CollectorIdentityService.getIdentity();

  headers.set("X-Device-ID", identity.deviceId);
  headers.set("X-Collector-ID", identity.collectorId);
  headers.set("X-Collector-Name", identity.collectorName);

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