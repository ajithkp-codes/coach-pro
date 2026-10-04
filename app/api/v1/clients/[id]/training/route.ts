import { ok, handle, parseBody } from "@/lib/api";
import { listSessions, createSession } from "@/lib/data/training";
import { workoutSessionSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return ok(await listSessions(id));
  });
}

export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const parsed = await parseBody(request, workoutSessionSchema);
    if ("response" in parsed) return parsed.response;
    return ok(await createSession(id, parsed.data), 201);
  });
}
