"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authed } from "@/lib/data/session";

const schema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  business_name: z.string().trim().max(120).optional().transform((v) => (v ? v : null)),
});

export interface ProfileState {
  ok?: boolean;
  error?: string;
}

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    business_name: formData.get("business_name") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { supabase, trainerId } = await authed();
  const { error } = await supabase
    .from("trainers")
    .update(parsed.data)
    .eq("id", trainerId);
  if (error) return { error: error.message };
  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { ok: true };
}
