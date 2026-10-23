"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { autoMap } from "@/lib/import/column-match";
import { FIELD_BY_KEY, FIELD_GROUPS, IMPORT_FIELDS } from "@/lib/import/fields";
import { buildRecords, detectHeaderRow, readWorkbook } from "@/lib/import/parse";
import type { SheetData, ImportSummary } from "@/lib/import/types";
import {
  bulkImportClientsAction,
  suggestImportMappingAction,
} from "@/app/(dashboard)/clients/import/actions";

type Step = "upload" | "sheet" | "map" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "sheet", label: "Sheet" },
  { key: "map", label: "Map columns" },
  { key: "review", label: "Review" },
];

export function ClientImporter({
  remaining,
  limit,
  plan,
  aiEnabled = false,
}: {
  remaining: number;
  limit: number | null;
  plan: string;
  aiEnabled?: boolean;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [headerRow, setHeaderRow] = useState(0);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [defaultDate, setDefaultDate] = useState(todayISO());
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const sheet = sheets[sheetIdx];
  const headers = sheet?.rows[headerRow] ?? [];
  const dataRows = useMemo(
    () => (sheet ? sheet.rows.slice(headerRow + 1) : []),
    [sheet, headerRow],
  );

  const build = useMemo(
    () =>
      buildRecords(dataRows, mapping, {
        defaultDateISO: defaultDate,
        startRow: headerRow + 2, // 1-based spreadsheet row of the first data row
      }),
    [dataRows, mapping, defaultDate, headerRow],
  );

  const hasName = Object.values(mapping).includes("full_name");
  const willImport = Math.min(build.records.length, remaining);

  async function handleFile(file: File) {
    setParseError(null);
    setFileName(file.name);
    try {
      const parsed = await readWorkbook(file);
      const nonEmpty = parsed.filter((s) => s.rows.length > 0);
      if (nonEmpty.length === 0) {
        setParseError("That workbook has no readable rows.");
        return;
      }
      // Default to the sheet with the most rows (usually the master roster).
      let best = 0;
      nonEmpty.forEach((s, i) => {
        if (s.rows.length > nonEmpty[best].rows.length) best = i;
      });
      setSheets(nonEmpty);
      setSheetIdx(best);
      setStep("sheet");
    } catch {
      setParseError("Couldn’t read that file. Supported: .xlsx, .xls, .csv");
    }
  }

  function confirmSheet() {
    const s = sheets[sheetIdx];
    const hr = detectHeaderRow(s.rows);
    setHeaderRow(hr);
    setMapping(autoMap(s.rows[hr] ?? []));
    setAiMsg(null);
    setStep("map");
  }

  async function runAi() {
    setAiBusy(true);
    setAiMsg(null);
    try {
      const res = await suggestImportMappingAction({
        headers,
        samples: dataRows.slice(0, 3),
      });
      const next = { ...mapping };
      headers.forEach((h, i) => {
        const key = res.mapping[h];
        if (key && FIELD_BY_KEY[key]) next[i] = key;
      });
      setMapping(next);
      setAiMsg(res.error ?? "Applied AI suggestions — review them below.");
    } finally {
      setAiBusy(false);
    }
  }

  async function doImport() {
    setImporting(true);
    try {
      // Send everything; the server caps to the plan limit and reports the
      // overflow as "plan limit" skips so the summary stays honest.
      const result = await bulkImportClientsAction(build.records);
      setSummary(result);
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep("upload");
    setFileName("");
    setSheets([]);
    setMapping({});
    setSummary(null);
    setConsent(false);
    setAiMsg(null);
  }

  // ---- Success summary ----
  if (summary) {
    const skipReasons = summary.skipped.reduce<Record<string, number>>((acc, s) => {
      acc[s.reason] = (acc[s.reason] ?? 0) + 1;
      return acc;
    }, {});
    return (
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Icon name="checkCircle" size={28} className="text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold">Import complete</h2>
              <p className="text-sm text-muted-foreground">
                {summary.imported} client{summary.imported === 1 ? "" : "s"} added to your roster.
              </p>
            </div>
          </div>
          {Object.keys(skipReasons).length > 0 && (
            <ul className="text-sm text-muted-foreground">
              {Object.entries(skipReasons).map(([reason, n]) => (
                <li key={reason}>
                  {n} skipped — {reason}
                </li>
              ))}
            </ul>
          )}
          {summary.errors.length > 0 && (
            <ul className="text-sm text-danger">
              {summary.errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e.row >= 0 ? `Row ${e.row}: ` : ""}{e.msg}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <ButtonLink href="/clients">View clients</ButtonLink>
            <Button variant="outline" onClick={reset}>
              Import another file
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Stepper step={step} />

      <p className="text-sm text-muted-foreground">
        {plan === "pro" ? "Pro plan" : "Free plan"}
        {limit != null ? ` — up to ${limit} clients. ` : " — unlimited clients. "}
        {limit != null && (
          <>
            <span className="font-medium text-foreground">{remaining}</span> slot
            {remaining === 1 ? "" : "s"} left.
          </>
        )}
      </p>

      {/* ---- Upload ---- */}
      {step === "upload" && (
        <Card>
          <CardBody className="flex flex-col gap-4">
            <Field
              label="Choose your Excel workbook"
              htmlFor="import-file"
              hint="We read every sheet in .xlsx, .xls, or .csv. Nothing is saved until you review and confirm."
            >
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
                className="block w-full text-sm file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary-hover"
              />
            </Field>
            {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}
            {parseError && <p className="text-sm text-danger">{parseError}</p>}
          </CardBody>
        </Card>
      )}

      {/* ---- Pick sheet ---- */}
      {step === "sheet" && (
        <Card>
          <CardBody className="flex flex-col gap-4">
            <Field label="Which sheet holds your client roster?" htmlFor="sheet-pick">
              <Select
                id="sheet-pick"
                value={sheetIdx}
                onChange={(e) => setSheetIdx(Number(e.target.value))}
              >
                {sheets.map((s, i) => (
                  <option key={s.name + i} value={i}>
                    {s.name} ({Math.max(0, s.rows.length - 1)} rows)
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={confirmSheet}>Continue</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---- Map columns ---- */}
      {step === "map" && (
        <Card>
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Map your columns</h2>
                <p className="text-sm text-muted-foreground">
                  We auto-matched what we could. Fix anything that looks wrong.
                </p>
              </div>
              {aiEnabled ? (
                <Button variant="outline" onClick={runAi} disabled={aiBusy}>
                  <Icon name="sparkles" size={16} />
                  {aiBusy ? "Asking AI…" : "AI assist"}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Columns matched automatically.
                </span>
              )}
            </div>
            {aiMsg && <p className="text-sm text-muted-foreground">{aiMsg}</p>}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Spreadsheet column</th>
                    <th className="py-2 pr-3 font-medium">Example</th>
                    <th className="py-2 font-medium">Import as</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h, i) => {
                    const sample = dataRows.find((r) => r[i]?.trim())?.[i] ?? "";
                    return (
                      <tr key={i} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-medium">{h || <span className="text-muted-foreground">Column {i + 1}</span>}</td>
                        <td className="max-w-[12rem] truncate py-2 pr-3 text-muted-foreground">{sample}</td>
                        <td className="py-2">
                          <Select
                            aria-label={`Import ${h || `column ${i + 1}`} as`}
                            value={mapping[i] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setMapping((m) => {
                                const next = { ...m };
                                if (v) next[i] = v;
                                else delete next[i];
                                return next;
                              });
                            }}
                          >
                            <option value="">— Ignore —</option>
                            {FIELD_GROUPS.map((group) => (
                              <optgroup key={group} label={group}>
                                {IMPORT_FIELDS.filter((f) => f.group === group).map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Field
              label="Measurement date for the snapshot"
              htmlFor="default-date"
              hint="Used for body metrics and health markers when your sheet has no date column."
              className="max-w-xs"
            >
              <Input
                id="default-date"
                type="date"
                value={defaultDate}
                onChange={(e) => setDefaultDate(e.target.value)}
              />
            </Field>

            {!hasName && (
              <p className="text-sm text-danger">
                Map one column to “Full name” to continue.
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("sheet")}>
                Back
              </Button>
              <Button onClick={() => setStep("review")} disabled={!hasName}>
                Review {build.records.length} client{build.records.length === 1 ? "" : "s"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ---- Review & import ---- */}
      {step === "review" && (
        <Card>
          <CardBody className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Review &amp; import</h2>
              <p className="text-sm text-muted-foreground">
                {build.records.length} client{build.records.length === 1 ? "" : "s"} ready
                {build.skipped.length > 0 && `, ${build.skipped.length} skipped (no name)`}.
                {build.records.length > remaining && (
                  <> Only {remaining} will import — you’re at your plan limit.</>
                )}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Contact</th>
                    <th className="py-2 pr-3 font-medium">Snapshot</th>
                    <th className="py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {build.records.slice(0, 20).map((r) => {
                    const flag = build.flags.find((f) => f.row === r.sourceRow);
                    const metricCount = r.metrics ? Object.keys(r.metrics).length - 1 : 0;
                    return (
                      <tr key={r.sourceRow} className="border-b border-border/60 align-top">
                        <td className="py-2 pr-3 text-muted-foreground">{r.sourceRow}</td>
                        <td className="py-2 pr-3 font-medium">{r.client.full_name}</td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {[r.client.phone, r.client.email].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {[
                            metricCount > 0 ? `${metricCount} metric${metricCount === 1 ? "" : "s"}` : null,
                            r.markers.length > 0 ? `${r.markers.length} marker${r.markers.length === 1 ? "" : "s"}` : null,
                            r.goal ? "goal" : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                        <td className="py-2 text-xs">
                          {flag ? (
                            <span className="text-warning">{flag.messages.join("; ")}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {build.records.length > 20 && (
              <p className="text-xs text-muted-foreground">
                Showing first 20 of {build.records.length}.
              </p>
            )}

            <label className="flex items-start gap-2 rounded-[var(--radius)] bg-muted/50 p-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I confirm these clients have consented to CoachPro storing their personal
                and health data. They’ll be imported as consented, dated today.
              </span>
            </label>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("map")} disabled={importing}>
                Back
              </Button>
              <Button onClick={doImport} disabled={!consent || importing || willImport === 0}>
                {importing ? "Importing…" : `Import ${willImport} client${willImport === 1 ? "" : "s"}`}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const activeIdx = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
              i <= activeIdx
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {i + 1}
          </span>
          <span className={cn(i === activeIdx ? "font-medium text-foreground" : "text-muted-foreground")}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <Icon name="chevronRight" size={14} className="text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}
