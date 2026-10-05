"use server";

import { revalidatePath } from "next/cache";
import { reportSchema } from "@/lib/validation";
import { createReport, setReportRevoked, deleteReport } from "@/lib/data/reports";

export interface ReportState {
  ok?: boolean;
  error?: string;
}

export async function createReportAction(
  clientId: string,
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const parsed = reportSchema.safeParse({
    title: formData.get("title") || undefined,
    period: formData.get("period") || "6m",
    include_photos: formData.get("include_photos"),
    expires_in_days: formData.get("expires_in_days") || "30",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid report" };
  }
  try {
    await createReport(clientId, parsed.data);
    revalidatePath(`/clients/${clientId}/report`);
    return { ok: true };
  } catch (e) {
    console.error("createReport failed", e);
    return { error: "Couldn't create the report. Please try again." };
  }
}

export async function setReportRevokedAction(
  clientId: string,
  id: string,
  revoked: boolean,
): Promise<void> {
  await setReportRevoked(id, revoked);
  revalidatePath(`/clients/${clientId}/report`);
}

export async function deleteReportAction(
  clientId: string,
  id: string,
): Promise<void> {
  await deleteReport(id);
  revalidatePath(`/clients/${clientId}/report`);
}
