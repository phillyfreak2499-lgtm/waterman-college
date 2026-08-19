import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getNoticeInbox, markNoticesRead } from "@/lib/notifications";
import { showLocalNotice } from "@/lib/push-client";
import { cn } from "@/lib/utils";
import type { NoticeItem } from "@/lib/notify";

export function NotificationBell({ inverted = false }: { inverted?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [unread, setUnread] = useState(0);
  const seen = useRef(new Set<string>());
  const box = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (announce = false) => {
    try {
      const next = await getNoticeInbox();
      if (announce) {
        for (const item of next.items) {
          if (!item.read && !seen.current.has(item.id)) {
            showLocalNotice(item.title, item.body, item.href);
          }
        }
      }
      seen.current = new Set(next.items.map((item) => item.id));
      setItems(next.items.slice(0, 6));
      setUnread(next.unread);
    } catch {
      /* signed out */
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    const timer = window.setInterval(() => void refresh(true), 45_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openPanel() {
    setOpen((v) => !v);
    if (!open && unread) {
      try {
        const next = await markNoticesRead({ data: {} });
        setUnread(next.unread);
        setItems((rows) => rows.map((row) => ({ ...row, read: true })));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => void openPanel()}
        className={cn(
          "relative grid h-11 w-11 place-items-center",
          inverted ? "text-paper" : "text-navy",
        )}
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-brass px-1 text-[0.6rem] font-semibold text-navy">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-[19rem] overflow-hidden rounded-md border border-line bg-paper shadow-lift">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-brass">
              Notices
            </p>
            <Link
              to="/notifications"
              className="text-[0.65rem] uppercase tracking-[0.14em] text-muted hover:text-navy"
              onClick={() => setOpen(false)}
            >
              Configure
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted">Nothing yet. The office will write here.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id} className="border-b border-line last:border-0">
                  <a href={item.href} className="block px-3 py-3 hover:bg-paper-2" onClick={() => setOpen(false)}>
                    <p className="font-display text-lg leading-tight">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.body}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
