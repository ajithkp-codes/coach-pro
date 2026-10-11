import { ok, handle, parseBody } from "@/lib/api";
import { listBodyMetrics, createBodyMetric } from "@/lib/data/bodyMetrics";
import { bodyMetricSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return ok(await listBodyMetrics(id));
  });
}

export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const parsed = await parseBody(request, bodyMetricSchema);
    if ("response" in parsed) return parsed.response;
    return ok(await createBodyMetric(id, parsed.data), 201);
  });
}
