"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Field } from "@/components/ui/field";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { requestDemo } from "./demo-actions";

const HOST_EMAIL = "ajithsworkmail@gmail.com";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30, no DST

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Fixed daily slots in IST, 9:00 AM through 11:30 PM (the last 30-min call ends
 * at midnight). These are IST wall-clock times, identical for every visitor no
 * matter their own time zone — we turn the chosen one into an absolute instant.
 */
const SLOTS: { value: string; label: string }[] = [];
for (let m = 9 * 60; m < 24 * 60; m += 30) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? "AM" : "PM";
  SLOTS.push({ value: `${pad(h)}:${pad(mm)}`, label: `${h12}:${pad(mm)} ${ampm} IST` });
}

/** `now` shifted into IST, so UTC getters read the IST wall clock. */
function istNow() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function istDateStr(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Absolute instant for an IST calendar date + "HH:MM" slot. */
function instantFor(date: string, slot: string) {
  return new Date(`${date}T${slot}:00+05:30`);
}

/** Weekday (0 Sun … 6 Sat) of an IST calendar date string. */
function dayOfWeek(date: string) {
  const [y, mo, da] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, da)).getUTCDay();
}

/** Tomorrow in IST, skipping Sunday (we're closed Sundays). */
function defaultDate() {
  const d = istNow();
  d.setUTCDate(d.getUTCDate() + 1);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return istDateStr(d);
}

/** A friendly "Mon, 10 Nov · 10:00 AM IST" summary of the chosen slot. */
function slotSummary(date: string, slot: string) {
  const inst = instantFor(date, slot);
  const day = new Date(inst.getTime() + IST_OFFSET_MS); // IST wall clock
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getUTCDay()];
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][day.getUTCMonth()];
  const label = SLOTS.find((s) => s.value === slot)?.label ?? slot;
  return `${weekday}, ${day.getUTCDate()} ${month} · ${label}`;
}

/** Build a Google Calendar "create event" link with the host added as a guest. */
function googleCalendarUrl(f: {
  name: string;
  email: string;
  profession: string;
  note: string;
  start: Date;
}) {
  const start = f.start;
  const end = new Date(start.getTime() + 30 * 60_000); // 30-minute call
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const details = [
    "Intro / demo call for CoachPro.",
    "",
    `Name: ${f.name}`,
    `Email: ${f.email}`,
    f.profession ? `Profession: ${f.profession}` : "",
    f.note ? `Notes: ${f.note}` : "",
  ]
    .filter((x) => x !== "")
    .join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `CoachPro demo — ${f.name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details,
    add: HOST_EMAIL,
    ctz: "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function DemoBooking() {
  return (
    <Modal
      title="Book a demo"
      description="Pick a time and we'll meet on a quick call."
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="inline-flex h-[52px] items-center rounded-[10px] border border-white/30 px-6 text-[15px] font-semibold text-[#f6f3ee] transition-colors hover:bg-white/10"
        >
          Get a demo
        </button>
      )}
    >
      {(close) => <DemoForm onDone={close} />}
    </Modal>
  );
}

function DemoForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    profession: "",
    date: defaultDate(),
    slot: "10:00",
    note: "",
  });
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [calUrl, setCalUrl] = React.useState<string | null>(null);

  const minDate = istDateStr(istNow());

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (dayOfWeek(form.date) === 0) {
      setError("We're open Monday to Saturday — please pick another day.");
      return;
    }
    const start = instantFor(form.date, form.slot);
    if (start.getTime() < Date.now()) {
      setError("That time has already passed — please pick a later slot.");
      return;
    }

    setPending(true);
    const res = await requestDemo({
      name: form.name,
      email: form.email,
      profession: form.profession,
      preferredTime: start.toISOString(),
      note: form.note,
    });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCalUrl(
      googleCalendarUrl({
        name: form.name,
        email: form.email,
        profession: form.profession,
        note: form.note,
        start,
      }),
    );
  }

  // Success state — the request is saved; confirm the time on Google Calendar.
  if (calUrl) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon name="check" size={22} />
        </span>
        <div>
          <p className="text-base font-semibold text-foreground">Request received</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {slotSummary(form.date, form.slot)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            One last step — add the call to Google Calendar. It invites us both and
            lands in your inbox.
          </p>
        </div>
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Icon name="calendar" size={16} />
          Confirm on Google Calendar
        </a>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Name" htmlFor="demo-name" required>
        <Input
          id="demo-name"
          value={form.name}
          onChange={set("name")}
          placeholder="Your full name"
          autoComplete="name"
          required
        />
      </Field>
      <Field label="Email" htmlFor="demo-email" required>
        <Input
          id="demo-email"
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </Field>
      <Field label="Profession" htmlFor="demo-profession" hint="e.g. personal trainer, physio, gym owner">
        <Input
          id="demo-profession"
          value={form.profession}
          onChange={set("profession")}
          placeholder="What do you do?"
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="demo-date" hint="Mon–Sat" required>
          <Input
            id="demo-date"
            type="date"
            min={minDate}
            value={form.date}
            onChange={set("date")}
            required
          />
        </Field>
        <Field label="Time" htmlFor="demo-slot" hint="9:00 AM – 12:00 AM IST" required>
          <Select id="demo-slot" value={form.slot} onChange={set("slot")} required>
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Anything you'd like to cover?" htmlFor="demo-note">
        <Textarea
          id="demo-note"
          value={form.note}
          onChange={set("note")}
          placeholder="Optional"
        />
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="mt-1 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Booking…" : "Book demo"}
        </Button>
      </div>
    </form>
  );
}
