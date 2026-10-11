import { ok, handle, parseBody } from "@/lib/api";
import { listGoals, createGoal } from "@/lib/data/goals";
import { goalSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    return ok(await listGoals(id));
  });
}

export async function POST(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const parsed = await parseBody(request, goalSchema);
    if ("response" in parsed) return parsed.response;
    return ok(await createGoal(id, parsed.data), 201);
  });
}
