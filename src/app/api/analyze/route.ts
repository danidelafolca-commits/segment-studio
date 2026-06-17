import { NextResponse } from "next/server";
import {
  coerceMessage,
  countByClass,
  extractBase64Image,
  getPredictions,
  stripDataUrlPrefix,
  type AnalyzeResult,
  type Sam3Output,
} from "@/lib/roboflow";

export const runtime = "nodejs";

const ROBOFLOW_BASE = "https://serverless.roboflow.com";

interface RoboflowWorkflowResponse {
  outputs?: Array<Record<string, unknown>>;
}

export async function POST(request: Request) {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const workspace = process.env.ROBOFLOW_WORKSPACE_NAME;
  const workflowId = process.env.ROBOFLOW_WORKFLOW_ID ?? "custom-workflow";

  if (!apiKey || !workspace) {
    return NextResponse.json(
      {
        error:
          "Configuración del servidor incompleta: falta ROBOFLOW_API_KEY o ROBOFLOW_WORKSPACE_NAME en .env.local.",
      },
      { status: 500 }
    );
  }

  // Parse the request body coming from the client.
  let payload: { image?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido (se esperaba JSON)." },
      { status: 400 }
    );
  }

  const rawImage = typeof payload.image === "string" ? payload.image.trim() : "";
  if (!rawImage) {
    return NextResponse.json(
      { error: "No se recibió ninguna imagen." },
      { status: 400 }
    );
  }
  // Roboflow expects the bare base64, never the "data:image/...;base64," prefix.
  const base64 = stripDataUrlPrefix(rawImage);

  // Call the Roboflow workflow with the server-side API key.
  let roboflowData: RoboflowWorkflowResponse;
  try {
    const res = await fetch(`${ROBOFLOW_BASE}/infer/workflows/${workspace}/${workflowId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        inputs: { image: { type: "base64", value: base64 } },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Roboflow respondió con un error (${res.status}).`,
          detail: detail.slice(0, 600),
        },
        { status: 502 }
      );
    }

    roboflowData = (await res.json()) as RoboflowWorkflowResponse;
  } catch (err) {
    return NextResponse.json(
      {
        error: "No se pudo conectar con Roboflow.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }

  // The workflow returns its outputs as the first element of `outputs`.
  const output = Array.isArray(roboflowData.outputs)
    ? roboflowData.outputs[0] ?? {}
    : {};

  const sam3 = (output["sam_3_output"] as Sam3Output | undefined) ?? null;

  const rawCount = output["box_count"];
  const boxCount =
    typeof rawCount === "number"
      ? rawCount
      : Number.isFinite(Number(rawCount))
        ? Number(rawCount)
        : getPredictions(sam3).length;

  const result: AnalyzeResult = {
    annotatedImage: extractBase64Image(output["bounding_box_visualization_output"]),
    boxCount,
    message: coerceMessage(output["vision_events_message"]),
    classCounts: countByClass(sam3),
    predictions: sam3,
  };

  return NextResponse.json(result);
}
