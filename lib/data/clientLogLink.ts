import { randomBytes } from "crypto";
import { authed } from "./session";

/** The client's standing logging token (null = self-logging is turned off). */
export async function getClientLogToken(clientId: string): Promise<string | null> {
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("clients")
    .select("log_token")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return (data?.log_token as string | null) ?? null;
}

/** Turn self-logging on (or rotate the link), returning the new token. */
export async function setClientLogToken(clientId: string): Promise<string> {
  const { supabase } = await authed();
  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase
    .from("clients")
    .update({ log_token: token, log_token_created_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) throw error;
  return token;
}

/** Turn self-logging off — the existing link stops resolving. */
export async function clearClientLogToken(clientId: string): Promise<void> {
  const { supabase } = await authed();
  const { error } = await supabase
    .from("clients")
    .update({ log_token: null, log_token_created_at: null })
    .eq("id", clientId);
  if (error) throw error;
}
