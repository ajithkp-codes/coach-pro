"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(200),
  profession: z.string().trim().max(120).optional().or(z.literal("")),
  // Absolute instant (ISO 8601 with offset) for the chosen IST slot.
  preferredTime: z.string().trim().min(1, "Please pick a time"),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type DemoRequestResult = { ok: true } | { ok: false; error: string };

/**
 * Validate that an absolute instant falls inside the booking window, which is
 * defined purely in IST (UTC+5:30, no DST) so it holds for every visitor
 * regardless of their own time zone: Mon–Sat, 09:00 up to 24:00 IST.
 */
function withinISTWindow(iso: string): boolean {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  if (t.getTime() < Date.now()) return false; // no past slots
  // Shift to IST and read the wall-clock parts via UTC getters.
  const ist = new Date(t.getTime() + 5.5 * 60 * 60 * 1000);
  const dow = ist.getUTCDay(); // 0 Sun … 6 Sat
  if (dow === 0) return false; // Sunday closed
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  if (minutes % 30 !== 0) return false; // on a half-hour slot
  return minutes >= 9 * 60 && minutes < 24 * 60; // 09:00 … before midnight
}

/**
 * Store a landing-page demo booking. Called from an unauthenticated visitor,
 * so it uses the service-role client (bypasses RLS) and writes only to the
 * dedicated demo_requests table.
 */
export async function requestDemo(input: {
  name: string;
  email: string;
  profession?: string;
  preferredTime: string;
  note?: string;
}): Promise<DemoRequestResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const { name, email, profession, preferredTime, note } = parsed.data;

  if (!withinISTWindow(preferredTime)) {
    return {
      ok: false,
      error: "Please pick a slot within Mon–Sat, 9:00 AM – 12:00 AM IST.",
    };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("demo_requests").insert({
      name,
      email,
      profession: profession || null,
      preferred_time: new Date(preferredTime).toISOString(),
      note: note || null,
    });
    if (error) {
      return { ok: false, error: "Could not save your request. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
