import { useEffect, useRef } from "react";
import { touchActivity } from "@/lib/activity";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

/**
 * Records that the signed-in user was active today, once per app session.
 * Feeds the practice-streak counter in the Locker. Best-effort and silent.
 */
export function ActivityPinger() {
  const { user } = useCurrentUserState();
  const pinged = useRef(false);
  useEffect(() => {
    if (pinged.current || !user) return;
    pinged.current = true;
    void touchActivity().catch(() => undefined);
  }, [user]);
  return null;
}
