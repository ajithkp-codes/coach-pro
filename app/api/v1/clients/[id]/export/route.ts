import { NextResponse } from "next/server";
import { fail, handle } from "@/lib/api";
import { exportClientData } from "@/lib/data/export";

type Ctx = { params: Promise<{ id: string }> };

/** Download a client's full record as JSON (DPDP/GDPR data-access right). */
export async function GET(_request: Request, { params }: Ctx) {
  return handle(async () => {
    const { id } = await params;
    const payload = await exportClientData(id);
    if (!payload.client) return fail("Client not found", 404);

    const safeName = payload.client.full_name
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase();
    const filename = `coachpro-${safeName}-${id.slice(0, 8)}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
