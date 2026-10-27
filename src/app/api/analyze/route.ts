import { NextResponse } from "next/server";
import {
  coerceMessage,
  countDetectionsByClass,
  extractBase64Image,
  extractImageDims,
  normalizeDetections,
  stripDataUrlPrefix,
  type AnalyzeResult,
} from "@/lib/roboflow";
import { MemoryRateLimiter, clientKey } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const ROBOFLOW_BASE = "https://serverless.roboflow.com";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // decoded image bytes
const ROBOFLOW_TIMEOUT_MS = 55_000;

const limiter = new MemoryRateLimiter(10, 60_000); // 10 requests / minute / IP

interface RoboflowWorkflowResponse {
  outputs?: Array<Record<string, unknown>>;
}

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** True if the bytes start with a PNG or JPEG signature. */
function looksLikeImage(buf: Buffer): boolean {
  const png = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const jpg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  return png || jpg;
}

/** Reject cross-site browser requests (best-effort, not authentication). */
function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetches may omit it
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const workspace = process.env.ROBOFLOW_WORKSPACE_NAME;
  const workflowId = process.env.ROBOFLOW_WORKFLOW_ID ?? "custom-workflow";

  if (!apiKey || !workspace) {
    return fail(
      "Configuración del servidor incompleta: falta ROBOFLOW_API_KEY o ROBOFLOW_WORKSPACE_NAME en .env.local.",
      500
    );
  }

  if (!originAllowed(request)) return fail("Origen no permitido.", 403);
  if (!limiter.check(clientKey(request))) {
    return fail("Demasiadas peticiones. Espera un minuto e inténtalo de nuevo.", 429);
  }

  let payload: { image?: unknown };
  try {
    payload = await request.json();
  } catch {
    return fail("Cuerpo de la petición inválido (se esperaba JSON).", 400);
  }

  const rawImage = typeof payload.image === "string" ? payload.image.trim() : "";
  if (!rawImage) return fail("No se recibió ninguna imagen.", 400);

  // Roboflow expects the bare base64, never the "data:image/...;base64," prefix.
  const base64 = stripDataUrlPrefix(rawImage);
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > MAX_IMAGE_BYTES) {
    return fail(
      `La imagen supera el límite de ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`,
      413
    );
  }
  if (!looksLikeImage(bytes)) {
    return fail("El archivo no es una imagen JPG o PNG válida.", 415);
  }

  let roboflowData: RoboflowWorkflowResponse;
  try {
    const res = await fetch(`${ROBOFLOW_BASE}/infer/workflows/${workspace}/${workflowId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(ROBOFLOW_TIMEOUT_MS),
      body: JSON.stringify({
        api_key: apiKey,
        inputs: { image: { type: "base64", value: base64 } },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[analyze] Roboflow ${res.status}:`, detail.slice(0, 600));
      return fail(`Roboflow respondió con un error (${res.status}).`, 502);
    }

    roboflowData = (await res.json()) as RoboflowWorkflowResponse;
  } catch (err) {
    const timeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    console.error("[analyze] Roboflow request failed:", err);
    return fail(
      timeout
        ? "Roboflow tardó demasiado en responder (timeout)."
        : "No se pudo conectar con Roboflow.",
      timeout ? 504 : 502
    );
  }

  const output = Array.isArray(roboflowData.outputs) ? roboflowData.outputs[0] ?? {} : {};
  const sam3 = output["sam_3_output"] ?? null;
  const detections = normalizeDetections(sam3);
  const rawCount = output["box_count"];
  // Single source of truth: detections. `box_count` is only a fallback.
  const boxCount =
    detections.length > 0 || typeof rawCount !== "number" ? detections.length : rawCount;

  const inferenceId =
    typeof output["inference_id"] === "string" ? (output["inference_id"] as string) : null;

  const result: AnalyzeResult = {
    annotatedImage: extractBase64Image(output["bounding_box_visualization_output"]),
    boxCount,
    message: coerceMessage(output["vision_events_message"]),
    classCounts: countDetectionsByClass(detections),
    detections,
    image: extractImageDims(sam3),
    inferenceId,
  };

  return NextResponse.json(result);
}
