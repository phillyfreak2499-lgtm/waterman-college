import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthGate } from "@/components/auth-gate";
import { PageIntro } from "@/components/page-intro";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  getNoticeInbox,
  markNoticesRead,
  saveNoticePrefs,
  sendTestNotice,
  type NoticePrefs,
} from "@/lib/notifications";
import type { NoticeItem } from "@/lib/notify";
import { disablePush, enablePush, notificationSupported } from "@/lib/push-client";
import { pageHead } from "@/lib/page-title";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () =>
    pageHead(
      "Notifications",
      "Choose what the office may send to your phone and this desk.",
    ),
});

function NotificationsPage() {
  return (
    <SiteShell>
      <AuthGate>
        <Desk />
      </AuthGate>
    </SiteShell>
  );
}

function Desk() {
  const [prefs, setPrefs] = useState<NoticePrefs | null>(null);
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const supported = notificationSupported();

  async function load() {
    const next = await getNoticeInbox();
    setPrefs(next.prefs);
    setItems(next.items);
  }

  useEffect(() => {
    void load().catch((error) =>
      toast.error(error instanceof Error ? error.message : "Could not load notices"),
    );
  }, []);

  async function persist(next: NoticePrefs) {
    setPrefs(next);
    try {
      setPrefs(await saveNoticePrefs({ data: next }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    }
  }

  async function turnOn() {
    setBusy(true);
    try {
      const result = await enablePush();
      const next = await saveNoticePrefs({
        data: { ...(prefs ?? { remarkable: true, training: true, account: true, quiz: true }), enabled: true },
      });
      setPrefs(next);
      toast.success(
        result.mode === "push"
          ? "Push is on. Keep the campus on your Home Screen."
          : "Alerts are on in this browser. Add to Home Screen for lock-screen push.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enable");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      await disablePush();
      if (prefs) setPrefs(await saveNoticePrefs({ data: { ...prefs, enabled: false } }));
      toast.success("Push is off.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not turn off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      await sendTestNotice();
      await load();
      toast.success("A test note is in your inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  if (!prefs) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20">
        <div className="h-40 animate-pulse rounded-md bg-navy/5" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 sm:px-8 sm:py-20">
      <PageIntro
        kicker="Office"
        title="Notifications"
        lede="Hear when a course is assigned, when the weekly note lands, and when the office writes you."
      />

      <section className="mt-10 rounded-lg border border-line bg-surface p-6 shadow-card">
        <p className="kicker">Push</p>
        <h2 className="mt-3 font-display text-3xl leading-none">
          {prefs.enabled ? "On" : "Off"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {supported
            ? "On iPhone this only works after you add the campus to your Home Screen. Android can install from Chrome."
            : "This browser cannot show system notifications."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {prefs.enabled ? (
            <Button type="button" variant="outline" disabled={busy} onClick={() => void turnOff()}>
              {busy ? "Saving…" : "Turn off"}
            </Button>
          ) : (
            <Button type="button" disabled={busy || !supported} onClick={() => void turnOn()}>
              {busy ? "Asking…" : "Allow notifications"}
            </Button>
          )}
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void test()}>
            Send a test
          </Button>
          <Button asChild variant="ghost">
            <Link to="/install">Get the app</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8">
        <p className="kicker">What to send</p>
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          <PrefRow
            label="Be Remarkable"
            hint="The weekly huddle note"
            on={prefs.remarkable}
            onToggle={(remarkable) => void persist({ ...prefs, remarkable })}
          />
          <PrefRow
            label="Assigned training"
            hint="When a course is put on your path"
            on={prefs.training}
            onToggle={(training) => void persist({ ...prefs, training })}
          />
          <PrefRow
            label="Account"
            hint="Approval and office notes"
            on={prefs.account}
            onToggle={(account) => void persist({ ...prefs, account })}
          />
          <PrefRow
            label="Quizzes"
            hint="When a check-in is waiting"
            on={prefs.quiz}
            onToggle={(quiz) => void persist({ ...prefs, quiz })}
          />
        </ul>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="kicker">Inbox</p>
            <h2 className="mt-2 font-display text-3xl leading-none">Recent</h2>
          </div>
          {items.some((item) => !item.read) && (
            <button
              type="button"
              className="text-xs uppercase tracking-[0.14em] text-brass hover:text-navy"
              onClick={() => {
                void markNoticesRead({ data: {} }).then(() => load());
              }}
            >
              Mark all read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Nothing yet.</p>
        ) : (
          <ol className="mt-6 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="border-t border-line pt-4">
                <a href={item.href} className="block">
                  <p className={cn("font-display text-2xl leading-tight", !item.read && "text-navy")}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function PrefRow({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="font-display text-xl leading-none">{label}</p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onToggle(!on)}
        className={cn(
          "h-7 w-12 shrink-0 rounded-full border transition-colors",
          on ? "border-navy bg-navy" : "border-line bg-paper-2",
        )}
      >
        <span
          className={cn(
            "ml-0.5 block size-5 rounded-full bg-paper transition-transform",
            on && "translate-x-5",
          )}
        />
      </button>
    </li>
  );
}
