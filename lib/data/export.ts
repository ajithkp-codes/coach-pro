import { authed } from "./session";
import { getClient } from "./clients";

/**
 * Gather all data held for one client into a single JSON object.
 * Supports the DPDP/GDPR "data access / portability" right (export on request).
 */
export async function exportClientData(clientId: string) {
  const { supabase } = await authed();
  const client = await getClient(clientId);
  if (!client) throw new Error("Client not found");

  const [metrics, markers, goals, sessions, photos, sharedFiles] = await Promise.all([
    supabase.from("body_metrics").select("*").eq("client_id", clientId).order("measured_on"),
    supabase.from("health_markers").select("*").eq("client_id", clientId).order("measured_on"),
    supabase.from("goals").select("*").eq("client_id", clientId).order("created_at"),
    supabase
      .from("workout_sessions")
      .select("*, sets:workout_sets(*)")
      .eq("client_id", clientId)
      .order("performed_on"),
    supabase.from("client_photos").select("*").eq("client_id", clientId).order("taken_on"),
    supabase.from("shared_files").select("*").eq("client_id", clientId).order("created_at"),
  ]);

  return {
    exported_at: new Date().toISOString(),
    client,
    body_metrics: metrics.data ?? [],
    health_markers: markers.data ?? [],
    goals: goals.data ?? [],
    workout_sessions: sessions.data ?? [],
    // Photo + file metadata only (the files live in private Storage).
    photos: photos.data ?? [],
    shared_files: sharedFiles.data ?? [],
  };
}
