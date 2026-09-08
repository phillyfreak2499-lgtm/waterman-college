import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listMedia, uploadMedia, type MediaItem } from "@/lib/cms";

/**
 * Shared image field: upload a new image (base64 → uploadMedia) and/or pick one
 * from the media library. Extracted from the Office so the Training Building
 * Center reuses the exact same upload/validation path.
 */

export function fileToPayload(file: File) {
  return new Promise<{ filename: string; mime: string; data: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const data = result.includes(",") ? result.split(",")[1] : result;
      resolve({ filename: file.name, mime: file.type || "image/jpeg", data: data ?? "" });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function ImageField({
  label,
  value,
  onChange,
  onUploaded,
  allowClear,
  clearTo,
  withLibrary = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUploaded?: (item: MediaItem) => void;
  allowClear?: boolean;
  clearTo?: string;
  /** Show a "Choose from library" button that opens the media picker. */
  withLibrary?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const payload = await fileToPayload(file);
      const uploaded = await uploadMedia({ data: payload });
      onChange(uploaded.url);
      onUploaded?.({ id: uploaded.id, filename: uploaded.filename, mime: file.type, data: uploaded.url });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {value && (
        <img src={value} alt="" className="mb-3 h-28 w-full rounded-sm border border-line object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/*"
          className="block min-w-0 flex-1 text-sm"
          disabled={busy}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        {withLibrary && (
          <button
            type="button"
            className="h-11 shrink-0 text-sm text-navy hover:underline"
            onClick={() => setPicking(true)}
          >
            Choose from library
          </button>
        )}
        {allowClear && value && value !== clearTo && (
          <button
            type="button"
            className="h-11 shrink-0 text-sm text-muted hover:text-navy"
            onClick={() => onChange(clearTo ?? "")}
          >
            Use default
          </button>
        )}
      </div>
      {picking && (
        <MediaPicker
          onPick={(url) => {
            onChange(url);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    listMedia()
      .then((next) => !cancelled && setItems(next))
      .catch((reason) => !cancelled && setError(reason instanceof Error ? reason.message : "Could not load uploads"));
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose an image"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-lg border border-line bg-paper p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl">Media library</h3>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-muted" role="alert">{error}</p>}
        {items === null && !error && <p className="mt-3 text-sm text-muted">Loading…</p>}
        {items && items.length === 0 && (
          <p className="mt-3 text-sm text-muted">No uploads yet — add one from the field above.</p>
        )}
        {items && items.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="overflow-hidden rounded-md border border-line bg-surface text-left hover:border-navy/40"
                onClick={() => onPick(item.data)}
              >
                <img src={item.data} alt="" className="aspect-[4/3] w-full object-cover" />
                <span className="block truncate px-2 py-1 text-xs text-muted">{item.filename}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
