import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/components/install-app";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/install")({
  component: InstallPage,
  head: () =>
    pageHead(
      "Get the app",
      "Add COGS to your phone’s Home Screen. Opens like an app — no App Store needed.",
    ),
});

function InstallPage() {
  const { deferred, installed, install, platform } = useInstallPrompt();

  return (
    <SiteShell>
      <div className="mx-auto max-w-lg px-5 py-14 sm:px-8 sm:py-20">
        <img src="/icon-180.png" alt="" className="size-16 rounded-2xl shadow-card" />
        <p className="kicker mt-6">Phone</p>
        <span className="rule-brass mt-3" />
        <h1 className="mt-4 font-display text-4xl leading-[0.95] sm:text-5xl">Get the campus on your phone.</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          This is not in the App Store or Play Store. Add it to your Home Screen and it opens full-screen, like an app.
        </p>

        {installed ? (
          <div className="mt-8 rounded-md border border-line bg-surface p-5 shadow-card">
            <p className="kicker">Already installed</p>
            <p className="mt-3 font-display text-2xl leading-none">It’s on this device.</p>
            <p className="mt-3 text-sm text-muted">Open it from your Home Screen the next time you train.</p>
          </div>
        ) : deferred ? (
          <div className="mt-8">
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => {
                void install();
              }}
            >
              Install COGS
            </Button>
            <p className="mt-3 text-center text-sm text-muted">Your phone will ask you to confirm.</p>
          </div>
        ) : (
          <ol className="mt-10 space-y-8">
            {platform === "ios" || platform === "other" ? (
              <li>
                <p className="kicker">iPhone</p>
                <h2 className="mt-2 font-display text-3xl leading-none">Safari, then Share</h2>
                <ol className="mt-4 space-y-3 text-[1.05rem] leading-relaxed text-ink/90">
                  <li>1. Open this campus in <strong>Safari</strong> — not inside another app’s browser.</li>
                  <li>2. Tap the <strong>Share</strong> button at the bottom (the square with the arrow).</li>
                  <li>3. Scroll and tap <strong>Add to Home Screen</strong>.</li>
                  <li>4. Tap <strong>Add</strong>. The navy W is your icon.</li>
                </ol>
              </li>
            ) : null}
            {platform === "android" || platform === "other" ? (
              <li>
                <p className="kicker">Android</p>
                <h2 className="mt-2 font-display text-3xl leading-none">Chrome, then Install</h2>
                <ol className="mt-4 space-y-3 text-[1.05rem] leading-relaxed text-ink/90">
                  <li>1. Open this campus in <strong>Chrome</strong>.</li>
                  <li>2. Tap the menu (three dots).</li>
                  <li>3. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                  <li>4. Confirm. The navy W is your icon.</li>
                </ol>
              </li>
            ) : null}
          </ol>
        )}

        <div className="mt-12 border-t border-line pt-8">
          <p className="text-sm leading-relaxed text-muted">
            After it’s on your Home Screen, sign in, then open{" "}
            <Link to="/notifications" className="text-navy underline-offset-4 hover:underline">
              Notifications
            </Link>{" "}
            and tap Allow. iPhone will not show lock-screen push until the campus is installed.
            First preview login: chancellor / CampusFirst1!
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
