import { ok, fail, handle, parseBody } from "@/lib/api";
import {
  getClient,
  updateClientRecord,
  deleteClientRecord,
} from "@/lib/data/clients";
import { clientSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const client = await getClient(id);
    if (!client) return fail("Client not found", 404);
    return ok(client);
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const parsed = await parseBody(request, clientSchema);
    if ("response" in parsed) return parsed.response;
    const client = await updateClientRecord(id, parsed.data);
    return ok(client);
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    await deleteClientRecord(id);
    return ok({ deleted: true });
  });
}
