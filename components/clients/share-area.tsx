"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { PhotosPanel } from "@/components/photos/photos-panel";
import { FilesPanel } from "@/components/files/files-panel";
import { ReportsPanel } from "@/components/report/reports-panel";
import type { ClientPhotoWithUrl, SharedFile, ProgressReport } from "@/lib/types";

type Tab = "photos" | "files" | "report";

export function ShareArea({
  clientId,
  photos,
  files,
  reports,
}: {
  clientId: string;
  photos: ClientPhotoWithUrl[];
  files: SharedFile[];
  reports: ProgressReport[];
}) {
  const [tab, setTab] = useState<Tab>("photos");

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "photos", label: "Photos" },
          { value: "files", label: "Files" },
          { value: "report", label: "Report" },
        ]}
      />

      {tab === "photos" && <PhotosPanel clientId={clientId} photos={photos} />}
      {tab === "files" && <FilesPanel clientId={clientId} files={files} />}
      {tab === "report" && <ReportsPanel clientId={clientId} reports={reports} />}
    </div>
  );
}
