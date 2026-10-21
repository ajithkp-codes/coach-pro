"use server";

import { submitClientLog } from "@/lib/data/client-log-public";

export interface ClientLogState {
  ok?: boolean;
  error?: string;
}

/**
 * Public submit for a client's self-logged day. The token (bound as the first
 * arg) is the only credential; trainer/client scope is resolved from it, never
 * from the form payload.
 */
export async function submitClientLogAction(
  token: string,
  _prev: ClientLogState,
  formData: FormData,
): Promise<ClientLogState> {
  let entries: unknown = [];
  const raw = formData.get("entries");
  if (typeof raw === "string" && raw) {
    try {
      entries = JSON.parse(raw);
    } catch {
      return { error: "Could not read your food entries." };
    }
  }

  const result = await submitClientLog(token, {
    logged_on: formData.get("logged_on"),
    water_ml: formData.get("water_ml") || undefined,
    notes: formData.get("notes") || undefined,
    entries,
  });

  if (!result.ok) return { error: result.error };
  return { ok: true };
}
