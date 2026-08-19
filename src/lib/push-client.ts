import {
  getPushPublicKey,
  removePushSubscription,
  savePushSubscription,
} from "@/lib/notifications";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function notificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushSupported() {
  return notificationSupported() && "serviceWorker" in navigator && "PushManager" in window;
}

export async function enablePush() {
  if (!notificationSupported()) throw new Error("This browser does not support notifications.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permission was not granted.");

  if (!pushSupported()) {
    return { mode: "local" as const };
  }

  try {
    const { publicKey } = await getPushPublicKey();
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error("Could not read the subscription.");
    }
    await savePushSubscription({
      data: { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
    });
    return { mode: "push" as const };
  } catch {
    return { mode: "local" as const };
  }
}

export async function disablePush() {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration("/");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await removePushSubscription({ data: { endpoint: sub.endpoint } });
    await sub.unsubscribe().catch(() => undefined);
  }
}

export function showLocalNotice(title: string, body: string, href?: string) {
  if (!notificationSupported() || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, icon: "/icon-192.png" });
  if (href) {
    n.onclick = () => {
      window.focus();
      window.location.assign(href);
      n.close();
    };
  }
}
