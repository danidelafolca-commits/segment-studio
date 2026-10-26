import type { AnalyzeResponse, AnalyzeResult } from "@/lib/roboflow";

export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const CLIENT_TIMEOUT_MS = 65_000;

export class AnalyzeError extends Error {
  constructor(
    public code: "size" | "timeout" | "rate" | "server" | "network" | "aborted",
    message?: string
  ) {
    super(message ?? code);
  }
}

export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== "string") return reject(new Error("read"));
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(new Error("file"));
    reader.readAsDataURL(file);
  });
}

function isErr(r: AnalyzeResponse): r is { error: string; detail?: string } {
  return typeof (r as { error?: unknown }).error === "string";
}

/** POST an image to /api/analyze with timeout + cancellation + safe parsing. */
export async function analyzeFile(file: File, outerSignal?: AbortSignal): Promise<AnalyzeResult> {
  if (file.size > MAX_FILE_BYTES) throw new AnalyzeError("size");

  const base64 = await fileToBase64(file);
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  outerSignal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => ctrl.abort("timeout"), CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data: AnalyzeResponse | null = null;
    try {
      data = JSON.parse(text) as AnalyzeResponse;
    } catch {
      /* not JSON (e.g. 413/504 HTML from the host) */
    }
    if (res.status === 429) throw new AnalyzeError("rate");
    if (res.status === 413) throw new AnalyzeError("size");
    if (res.status === 504) throw new AnalyzeError("timeout");
    if (!data) throw new AnalyzeError("server");
    if (!res.ok || isErr(data)) throw new AnalyzeError("server", isErr(data) ? data.error : undefined);
    return data;
  } catch (err) {
    if (err instanceof AnalyzeError) throw err;
    if (outerSignal?.aborted) throw new AnalyzeError("aborted");
    if (ctrl.signal.aborted) throw new AnalyzeError("timeout");
    throw new AnalyzeError("network");
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", onAbort);
  }
}

/** Natural (EXIF-aware) pixel dimensions of an image blob. */
export async function imageDims(blob: Blob): Promise<{ width: number; height: number }> {
  const bmp = await createImageBitmap(blob);
  const dims = { width: bmp.width, height: bmp.height };
  bmp.close();
  return dims;
}
