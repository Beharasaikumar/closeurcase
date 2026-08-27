import { Camera, HardDrive, MapPin, Mic, type LucideIcon } from "lucide-react";

export type DevicePermissionId = "camera" | "microphone" | "location" | "storage";

export type DevicePermissionState = "idle" | "pending" | "granted" | "denied" | "unsupported";

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
    id: "storage",
    label: "Storage",
    icon: HardDrive,
    reason:
      "To save case documents, drafts, and chat attachments on this device so they're available offline.",
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
      () => resolve("denied"),
      { timeout: 10_000 },
    );
  });
}

async function requestStorage(): Promise<DevicePermissionState> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return "unsupported";
  try {
    const granted = await navigator.storage.persist();
    return granted ? "granted" : "denied";
  } catch {
    return "unsupported";
  }
}

const REQUESTERS: Record<DevicePermissionId, () => Promise<DevicePermissionState>> = {
  camera: requestCamera,
  microphone: requestMicrophone,
  location: requestLocation,
  storage: requestStorage,
};

export function requestDevicePermission(id: DevicePermissionId) {
  return REQUESTERS[id]();
}
