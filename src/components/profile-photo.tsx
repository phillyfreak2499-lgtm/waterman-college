import { useState } from "react";
import { toast } from "sonner";
import { Initials } from "@/components/ui/field";
import { removeMyProfilePhoto, setMyProfilePhoto } from "@/lib/cms";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { errorMessage } from "@/lib/utils";

function fileToPayload(file: File) {
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

/** Lets a signed-in user upload or remove their own profile photo. */
export function ProfilePhoto() {
  const user = useCurrentUser();
  const [busy, setBusy] = useState(false);
  // Local override so the photo updates instantly; the rest of the app (header
  // avatar, directory) picks it up on the next session/page load.
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  const current = override === undefined ? (user?.profileImageUrl ?? null) : override;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await setMyProfilePhoto({ data: await fileToPayload(file) });
      setOverride(url);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(errorMessage(err) || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await removeMyProfilePhoto();
      setOverride(null);
      toast.success("Photo removed");
    } catch (err) {
      toast.error(errorMessage(err) || "Could not remove photo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-line bg-surface px-5 py-4 shadow-card">
      <Initials name={user?.displayName ?? "You"} src={current} className="size-14" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Your photo</p>
        <p className="mt-0.5 text-xs text-muted">PNG, JPEG, GIF, or WebP · under 1.5 MB.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            className="block min-w-0 flex-1 text-sm"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {current && (
            <button
              type="button"
              disabled={busy}
              className="h-9 shrink-0 text-sm text-muted hover:text-navy"
              onClick={() => void remove()}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
