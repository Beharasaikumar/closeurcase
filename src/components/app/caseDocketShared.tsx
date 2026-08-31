import type { LegalCase } from "@/types";

/**
 * Shared constants/helpers used by both CaseDocketRegister (search/filter
 * toolbar) and CasesTable (the actual table + edit/view dialog) — kept in
 * their own module so those two components can import from each other's
 * neighborhood without a circular import.
 */

export interface StatusMetaItem {
  label: string;
  color: "upcoming" | "soon" | "needs" | "closed" | "info" | "neutral";
  meaning: string;
}

export const STATUS_META: Record<string, StatusMetaItem> = {
  "Pending by Lawyer": {
    label: "Pending by Lawyer",
    color: "soon",
    meaning: "Received by the lawyer, not yet filed or registered in court",
  },
  "Rejected by Lawyer": {
    label: "Rejected by Lawyer",
    color: "needs",
    meaning: "Lawyer declined to take up the case",
  },
  "Accepted by Lawyer": {
    label: "Accepted by Lawyer",
    color: "info",
    meaning: "Lawyer has agreed to take the case and is preparing to file",
  },
  "Filing in progress": {
    label: "Filing in progress",
    color: "soon",
    meaning: "Lawyer is preparing the filing documents for the case",
  },
  "CNR Generated": {
    label: "CNR Generated",
    color: "info",
    meaning: "Case filed and a CNR number has been generated",
  },
};

export const STATUS_LIST = Object.keys(STATUS_META);

// Maps the legacy CaseStatus values (stored in DB) to the display filter keys above.
// This lets filters work without changing stored data or other parts of the app.
export const STORED_STATUS_TO_FILTER: Record<string, string> = {
  Submitted: "Pending by Lawyer",
  Assigned: "Accepted by Lawyer",
  Rejected: "Rejected by Lawyer",
  "Under Review": "Accepted by Lawyer",
  "In Progress": "Registered",
  "Awaiting Documents": "Accepted by Lawyer",
  Pending: "Pending",
  Resolved: "Disposed",
  Closed: "Disposed",
};

/** The pre-court pipeline a case moves through before it gets a CNR and is
 * registered in court — shown as a timestamped stage history in the lawyer's
 * case dialog while the case is still somewhere in this pipeline. */
export const PRE_CNR_STAGES = [
  "Pending by Lawyer",
  "Rejected by Lawyer",
  "Accepted by Lawyer",
  "Filing in progress",
  "CNR Generated",
];

export interface StageHistoryEntry {
  key: string;
  label: string;
  at: string | null;
  time: string | null;
  isCurrent: boolean;
}

/** Reconstructs when (if ever) each pre-CNR stage was reached, from the
 * case's timeline — falling back to updatedAt for the current stage if no
 * matching timeline entry exists (e.g. older seed data, which predates the
 * time-of-day field and so only carries a date). */
export function getStageHistory(c: LegalCase): StageHistoryEntry[] {
  const currentKey = STORED_STATUS_TO_FILTER[c.status] ?? c.status;
  return PRE_CNR_STAGES.map((key) => {
    const match = [...(c.timeline || [])]
      .reverse()
      .find((t) => (STORED_STATUS_TO_FILTER[t.status] ?? t.status) === key);
    const isCurrent = key === currentKey;
    return {
      key,
      label: STATUS_META[key]?.label ?? key,
      at: match?.at ?? (isCurrent ? c.updatedAt : null),
      time: match?.time ?? null,
      isCurrent,
    };
  });
}

export const COURTS_DATA = {
  courts: [
    {
      type: "High Court",
      courts: [
        { name: "Telangana High Court", location: "Hyderabad, Telangana" },
        {
          name: "High Court of Andhra Pradesh (Visakhapatnam Bench)",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "District Court",
      courts: [
        { name: "District Court, Hyderabad", location: "Hyderabad, Telangana" },
        { name: "District Court, Visakhapatnam", location: "Visakhapatnam, Andhra Pradesh" },
      ],
    },
    {
      type: "Sessions Court",
      courts: [
        { name: "Sessions Court, Hyderabad", location: "Hyderabad, Telangana" },
        { name: "Sessions Court, Visakhapatnam", location: "Visakhapatnam, Andhra Pradesh" },
      ],
    },
    {
      type: "Civil Court",
      courts: [
        { name: "City Civil Court, Hyderabad", location: "Hyderabad, Telangana" },
        { name: "City Civil Court, Visakhapatnam", location: "Visakhapatnam, Andhra Pradesh" },
      ],
    },
    {
      type: "Criminal Court",
      courts: [
        {
          name: "Chief Metropolitan Magistrate Court, Hyderabad",
          location: "Hyderabad, Telangana",
        },
        {
          name: "Chief Judicial Magistrate Court, Visakhapatnam",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "Family Court",
      courts: [
        { name: "Family Court, Hyderabad", location: "Hyderabad, Telangana" },
        { name: "Family Court, Visakhapatnam", location: "Visakhapatnam, Andhra Pradesh" },
      ],
    },
    {
      type: "Commercial Court",
      courts: [
        { name: "Commercial Court, Hyderabad", location: "Hyderabad, Telangana" },
        { name: "Commercial Court, Visakhapatnam", location: "Visakhapatnam, Andhra Pradesh" },
      ],
    },
    {
      type: "Labour Court",
      courts: [
        { name: "Labour Court, Hyderabad", location: "Hyderabad, Telangana" },
        { name: "Labour Court, Visakhapatnam", location: "Visakhapatnam, Andhra Pradesh" },
      ],
    },
    {
      type: "Consumer Court",
      courts: [
        {
          name: "District Consumer Disputes Redressal Commission, Hyderabad",
          location: "Hyderabad, Telangana",
        },
        {
          name: "District Consumer Disputes Redressal Commission, Visakhapatnam",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "Juvenile Justice Court",
      courts: [
        { name: "Juvenile Justice Board, Hyderabad", location: "Hyderabad, Telangana" },
        {
          name: "Juvenile Justice Board, Visakhapatnam",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "POCSO Court",
      courts: [
        { name: "Special Court for POCSO Cases, Hyderabad", location: "Hyderabad, Telangana" },
        {
          name: "Special Court for POCSO Cases, Visakhapatnam",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "NDPS Court",
      courts: [
        { name: "Special Court for NDPS Cases, Hyderabad", location: "Hyderabad, Telangana" },
        {
          name: "Special Court for NDPS Cases, Visakhapatnam",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "Motor Accident Claims Tribunal",
      courts: [
        { name: "Motor Accidents Claims Tribunal, Hyderabad", location: "Hyderabad, Telangana" },
        {
          name: "Motor Accidents Claims Tribunal, Visakhapatnam",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "NCLT",
      courts: [
        {
          name: "National Company Law Tribunal, Hyderabad Bench",
          location: "Hyderabad, Telangana",
        },
        {
          name: "National Company Law Tribunal, Visakhapatnam Bench",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "CAT",
      courts: [
        {
          name: "Central Administrative Tribunal, Hyderabad Bench",
          location: "Hyderabad, Telangana",
        },
        {
          name: "Central Administrative Tribunal, Visakhapatnam Bench",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
    {
      type: "DRT",
      courts: [
        { name: "Debt Recovery Tribunal, Hyderabad", location: "Hyderabad, Telangana" },
        {
          name: "Debt Recovery Tribunal, Visakhapatnam",
          location: "Visakhapatnam, Andhra Pradesh",
        },
      ],
    },
  ],
};

export const COURTS_FLAT = COURTS_DATA.courts.flatMap((group) =>
  group.courts.map((c) => ({ name: c.name, location: c.location, type: group.type })),
);

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export interface DocketHearing {
  id: string;
  date: string;
  place: string;
  purpose: string;
  natureOfSuit: string;
  adv: string;
}

export function getJourney(c: LegalCase): DocketHearing[] {
  const list: DocketHearing[] = (c.hearings || []).map((h) => ({
    id: h.id,
    date: h.date,
    place: h.courtOrVenue || "",
    purpose: h.note || "",
    natureOfSuit: h.hearingType || "",
    adv: h.Lawyer || (h.judges ? h.judges.join(", ") : ""),
  }));
  return list.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
}

export function getNextEntry(c: LegalCase): DocketHearing | null {
  const j = getJourney(c);
  if (j.length === 0) return null;
  const today = todayISO();
  return j.find((e) => e.date && e.date >= today) || j[j.length - 1];
}

/** Sort key for "soonest hearing first" ordering — cases with no hearing sort last. */
export function nextHearingSortKey(c: LegalCase) {
  return getNextEntry(c)?.date || "9999-99-99";
}

function getStatusStyle(colorKey: StatusMetaItem["color"]) {
  switch (colorKey) {
    case "upcoming":
      return {
        bg: "bg-[#d9f2dd] text-[#0b3818]",
        dot: "bg-[#2e6e3e]",
      };
    case "soon":
      return {
        bg: "bg-[#ffecb3] text-[#3e2e00]",
        dot: "bg-[#7a5900]",
      };
    case "needs":
      return {
        bg: "bg-[#f9dedc] text-[#410e0b]",
        dot: "bg-[#b3261e]",
      };
    case "info":
      return {
        bg: "bg-[#eaddff] text-[#21005d]",
        dot: "bg-[#6750a4]",
      };
    case "closed":
      return {
        bg: "bg-[#e6e0e9] text-[#49454f]",
        dot: "bg-[#79747e]",
      };
    case "neutral":
    default:
      return {
        bg: "bg-[#e9e7ec] text-[#1b1b1f]",
        dot: "bg-[#c4c6d0]",
      };
  }
}

export function StatusBadge({ status }: { status: string }) {
  // status may be a stored CaseStatus ("In Progress") or a filter key ("Registered")
  const filterKey = STORED_STATUS_TO_FILTER[status] ?? status;
  const meta = STATUS_META[filterKey] || STATUS_META["Pending by Lawyer"];
  const style = getStatusStyle(meta.color);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${style.bg}`}
      title={meta.meaning}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
      {meta.label}
    </span>
  );
}
