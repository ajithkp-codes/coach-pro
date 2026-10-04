"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/constants";
import { todayISO, formatDate } from "@/lib/format";
import {
  createPhotoAction,
  deletePhotoAction,
} from "@/app/(dashboard)/clients/[id]/photos/actions";
import type { ClientPhotoWithUrl } from "@/lib/types";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function extOf(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() : "";
  const ext = (fromName || file.type.split("/")[1] || "jpg").toLowerCase();
  return ext.replace(/[^a-z0-9]/g, "") || "jpg";
}

function Uploader({
  clientId,
  onSuccess,
  onCancel,
}: {
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [takenOn, setTakenOn] = useState(todayISO());
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) {
      setError("Choose a photo to upload.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 10 MB or smaller.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Your session expired. Please sign in again.");
        setBusy(false);
        return;
      }

      const path = `${user.id}/${clientId}/${crypto.randomUUID()}.${extOf(file)}`;
      const { error: upErr } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`);
        setBusy(false);
        return;
      }

      const fd = new FormData();
      fd.set("storage_path", path);
      fd.set("taken_on", takenOn);
      fd.set("caption", caption);
      const res = await createPhotoAction(clientId, {}, fd);
      if (res.error) {
        // Roll back the orphaned upload so we don't leave a file with no row.
        await supabase.storage.from(PHOTO_BUCKET).remove([path]);
        setError(res.error);
        setBusy(false);
        return;
      }

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label="Photo" htmlFor="photo" required>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded-[var(--radius)] file:border file:border-input file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date taken" htmlFor="taken_on" required>
          <Input
            id="taken_on"
            type="date"
            max={todayISO()}
            value={takenOn}
            onChange={(e) => setTakenOn(e.target.value)}
          />
        </Field>
        <Field label="Caption" htmlFor="caption">
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Front, week 8"
          />
        </Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" onClick={handleUpload} disabled={busy}>
          {busy ? "Uploading…" : "Upload photo"}
        </Button>
      </div>
    </div>
  );
}

export function PhotosPanel({
  clientId,
  photos,
}: {
  clientId: string;
  photos: ClientPhotoWithUrl[];
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {photos.length} photo{photos.length === 1 ? "" : "s"} · private, shown
          via expiring links
        </p>
        <Modal
          title="Add progress photo"
          description="Uploaded privately. Only you can see it."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> Add photo
            </Button>
          )}
        >
          {(close) => (
            <Uploader
              clientId={clientId}
              onCancel={close}
              onSuccess={() => {
                close();
                router.refresh();
              }}
            />
          )}
        </Modal>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          title="No photos yet"
          description="Upload progress photos to track visible change over time."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-[var(--radius)] border border-border bg-card"
            >
              <div className="aspect-square w-full bg-muted">
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt={p.caption ?? `Progress photo ${formatDate(p.taken_on)}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Unavailable
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2 p-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{formatDate(p.taken_on)}</p>
                  {p.caption && (
                    <p className="truncate text-xs text-muted-foreground">
                      {p.caption}
                    </p>
                  )}
                </div>
                <Modal
                  title="Delete photo?"
                  description="This permanently removes the photo."
                  trigger={(open) => (
                    <button
                      onClick={open}
                      aria-label="Delete photo"
                      className="shrink-0 text-xs text-muted-foreground hover:text-danger"
                    >
                      ✕
                    </button>
                  )}
                >
                  {(close) => (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={close}>
                        Cancel
                      </Button>
                      <form action={deletePhotoAction.bind(null, clientId, p.id)}>
                        <Button type="submit" variant="danger">
                          Delete
                        </Button>
                      </form>
                    </div>
                  )}
                </Modal>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
