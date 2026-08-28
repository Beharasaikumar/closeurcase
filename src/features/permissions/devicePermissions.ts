import { Bell, Camera, MapPin, Mic, type LucideIcon } from "lucide-react";

export type DevicePermissionId = "camera" | "microphone" | "location" | "notifications";

export type DevicePermissionState =
  "idle" | "pending" | "granted" | "denied" | "unavailable" | "unsupported";

export interface DevicePermissionDef {
  id: DevicePermissionId;
  label: string;
  icon: LucideIcon;
  /** Shown to the user before the native browser prompt fires, so they know
   * why CloseurCase is asking. */
  reason: string;
}

export const DEVICE_PERMISSIONS: DevicePermissionDef[] = [
  {
    id: "camera",
    label: "Camera",
    icon: Camera,
    reason:
      "To scan and upload photos of documents, evidence, or your ID during case filing and verification.",
  },
  {
    id: "microphone",
    label: "Microphone",
    icon: Mic,
    reason:
      "To record voice notes and let you describe your case or talk to LexBot using your voice.",
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    reason:
      "To match you with nearby lawyers and courts, and auto-fill your city while filing a case.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    reason:
      "To alert you about case status changes, new messages, and upcoming hearing dates in real time.",
  },
];

async function requestCamera(): Promise<DevicePermissionState> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    return "granted";
  } catch {
    return "denied";
  }
}

async function requestMicrophone(): Promise<DevicePermissionState> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return "granted";
  } catch {
    return "denied";
  }
}

async function requestLocation(): Promise<DevicePermissionState> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return "unsupported";
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      (err) => {
        // PERMISSION_DENIED (1) means the user/browser explicitly blocked us.
        // POSITION_UNAVAILABLE (2) and TIMEOUT (3) are what we get when the
        // device's location services (GPS) are switched off at the OS level —
        // the browser permission itself may be fine, so "denied" would mislead.
        resolve(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { timeout: 10_000 },
    );
  });
}

async function requestNotifications(): Promise<DevicePermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted" ? "granted" : "denied";
  } catch {
    return "unsupported";
  }
}

const REQUESTERS: Record<DevicePermissionId, () => Promise<DevicePermissionState>> = {
  camera: requestCamera,
  microphone: requestMicrophone,
  location: requestLocation,
  notifications: requestNotifications,
};

export function requestDevicePermission(id: DevicePermissionId) {
  return REQUESTERS[id]();
}

/** Extra context shown under a permission row once it settles into a state
 * that isn't self-explanatory from the icon alone (e.g. GPS off vs. blocked,
 * or "no prompt was shown, that's normal for this one"). */
export function getPermissionHint(
  id: DevicePermissionId,
  state: DevicePermissionState,
): string | null {
  if (id === "location" && state === "unavailable") {
    return "Your device's location is turned off. Turn on location/GPS in your phone or browser settings, then try again.";
  }
  return null;
}
