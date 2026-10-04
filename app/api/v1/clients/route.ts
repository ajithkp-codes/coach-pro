import { ok, handle, parseBody } from "@/lib/api";
import { listClients, createClientRecord } from "@/lib/data/clients";
import { clientSchema } from "@/lib/validation";
import type { ClientStatus } from "@/lib/types";

export async function GET(request: Request) {
  return handle(async () => {
    const status = new URL(request.url).searchParams.get("status");
    const clients = await listClients(
      (status as ClientStatus | "all") ?? "active",
    );
    return ok(clients);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const parsed = await parseBody(request, clientSchema);
    if ("response" in parsed) return parsed.response;
    const client = await createClientRecord(parsed.data);
    return ok(client, 201);
  });
}
