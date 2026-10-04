import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/** Standard JSON helpers for the /api/v1 route handlers. */

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Parse + validate a JSON body against a schema, returning typed data or a 400. */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { response: fail("Invalid JSON body") };
  }
  try {
    return { data: schema.parse(json) };
  } catch (e) {
    if (e instanceof ZodError) {
      return { response: fail(e.issues[0]?.message ?? "Validation failed", 422) };
    }
    return { response: fail("Validation failed", 422) };
  }
}

/** Wrap a handler so thrown errors become clean 500s (auth throws → 401). */
export async function handle(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    if (message === "Not authenticated") return fail("Unauthorized", 401);
    return fail(message, 500);
  }
}
