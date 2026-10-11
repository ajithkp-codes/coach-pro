import { ok, handle, parseBody } from "@/lib/api";
import {
  listHealthMarkers,
  createHealthMarker,
} from "@/lib/data/healthMarkers";
import { healthMarkerSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const marker = new URL(request.url).searchParams.get("marker") ?? undefined;
    return ok(await listHealthMarkers(id, marker));
  });
}

export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const parsed = await parseBody(request, healthMarkerSchema);
    if ("response" in parsed) return parsed.response;
    return ok(await createHealthMarker(id, parsed.data), 201);
  });
}
