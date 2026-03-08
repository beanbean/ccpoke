import type { ResponseData, ResponseParams, ViewState } from "./types";
import { getStorage, setStorage } from "../../utils/storage";

const LOCALHOST_FALLBACK = "http://localhost:9377";

/** Distinguishes 404 (data expired) from network errors */
export class NotFoundError extends Error {
  constructor() {
    super("not_found");
    this.name = "NotFoundError";
  }
}

function isValidApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function parseQueryParams(): ResponseParams | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const api = params.get("api");

  if (!id || !api || !isValidApiUrl(api)) return null;

  return {
    id,
    api,
    project: params.get("p") ?? "",
  };
}

/** Fetch with error distinction: throws NotFoundError on 404, returns null on network error */
async function tryFetch(apiBase: string, id: string): Promise<ResponseData | null> {
  try {
    const response = await fetch(`${apiBase}/api/responses/${id}`);
    if (response.status === 404) throw new NotFoundError();
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    return null;
  }
}

export async function fetchResponse(params: ResponseParams): Promise<ViewState> {
  // Build fallback URL chain: api param → localStorage → localhost
  const candidates: string[] = [params.api];
  const savedUrl = getStorage("tunnelUrl");
  if (savedUrl && savedUrl !== params.api && isValidApiUrl(savedUrl)) {
    candidates.push(savedUrl);
  }
  if (!candidates.includes(LOCALHOST_FALLBACK)) {
    candidates.push(LOCALHOST_FALLBACK);
  }

  for (const url of candidates) {
    try {
      const data = await tryFetch(url, params.id);
      if (data) {
        setStorage("tunnelUrl", url);
        return { kind: "success", data };
      }
    } catch (err) {
      // 404 means data actually expired — don't try other URLs
      if (err instanceof NotFoundError) {
        return { kind: "error", message: "expired" };
      }
    }
  }

  // All URLs failed with network errors
  return { kind: "error", message: "network" };
}
