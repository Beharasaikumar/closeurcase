import type {
  AppNotification,
  CaseDocument,
  CaseNote,
  CaseStatus,
  Citizen,
  HistoryOfHearing,
  KnowledgeItem,
  Lawyer,
  LawyerDocument,
  LegalCase,
  Payment,
  Subscription,
  UserRole,
  VideoCall,
  WithdrawalRequest,
} from "@/types";
import {
  categories as seedCategories,
  citizens as seedCitizens,
  lawyers as seedLawyers,
  cases as seedCases,
  subscriptions as seedSubscriptions,
  payments as seedPayments,
  notifications as seedNotifications,
  videoCalls as seedVideoCalls,
  knowledgeBase as seedKnowledgeBase,
} from "./mock";

const LAWYERS_KEY = "cuc_lawyers_v9";
const CITIZENS_KEY = "cuc_citizens_v3";
const NOTIFICATIONS_KEY = "cuc_notifications_v2";
const VIDEO_CALLS_KEY = "cuc_video_calls_v1";
const KB_KEY = "cuc_kb_v3";
const LAWYER_DOCS_KEY = "cuc_lawyer_docs_v1";
const PROFILE_PHOTOS_KEY = "cuc_profile_photos_v1";
const CASES_KEY = "cuc_cases_v12";
const NOTES_KEY = "cuc_case_notes_v1";
const SUBSCRIPTIONS_KEY = "cuc_subscriptions_v1";
const PAYMENTS_KEY = "cuc_payments_v1";
const LAWYER_RATINGS_KEY = "cuc_lawyer_ratings_v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function subscribeToStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ── Generic LocalStorage Helpers ────────────────────────────────────────── */
function load<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as T;
  } catch {
    return seed;
  }
}

function save<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyListeners();
  } catch (err) {
    console.error("Failed to save to store", err);
  }
}

/* ── CASES STORE ─────────────────────────────────────────────────────────── */

/** CloseUrCase ID for a newly-filed case — derived from the filing datetime
 * (down to the second) so it's unique, sortable, and traceable to when the
 * citizen actually registered the case, e.g. "CUC-20260831154512". */
export function generateCloseUrCaseId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `CUC ID - ${stamp}`;
}

export function getCases(): LegalCase[] {
  const cases = load<LegalCase[]>(CASES_KEY, seedCases);
  const existingIds = new Set(cases.map((c) => c.id));
  const missingSeedEmergency = seedCases.filter((sc) => sc.isEmergency && !existingIds.has(sc.id));
  if (missingSeedEmergency.length > 0) {
    const merged = [...missingSeedEmergency, ...cases];
    save(CASES_KEY, merged);
    return merged;
  }
  return cases;
}

export function saveCases(cases: LegalCase[]) {
  save(CASES_KEY, cases);
}

export function addCase(c: LegalCase) {
  const current = getCases();
  const updated = [c, ...current];
  saveCases(updated);

  // Auto-generate notification for citizen
  addNotification({
    title: "New Case Created",
    body: `Your case "${c.title}" (${c.id}) has been filed successfully${c.lawyerName ? ` and assigned to ${c.lawyerName}` : ""}.`,
  });

  if (c.lawyerName) {
    addNotification({
      title: "Lawyer Assigned",
      body: `${c.lawyerName} was linked to your case ${c.id}. Track updates in your dashboard.`,
    });
  }
}

export function updateCaseStatus(id: string, newStatus: CaseStatus, note?: string) {
  const current = getCases();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const updated = current.map((c) => {
    if (c.id !== id) return c;
    const timeline = c.timeline || [];
    const newTimeline = [
      ...timeline,
      {
        id: `t_${Date.now()}`,
        status: newStatus,
        at: today,
        time,
        note: note || `Status updated to ${newStatus}`,
      },
    ];
    return {
      ...c,
      status: newStatus,
      updatedAt: today,
      timeline: newTimeline,
    };
  });

  saveCases(updated);

  // Notify citizen
  const found = updated.find((x) => x.id === id);
  if (found) {
    addNotification({
      title: `Case Status: ${newStatus}`,
      body: `Case ${id} (${found.title}) status was updated to ${newStatus}${note ? `: "${note}"` : ""}.`,
    });
  }
}

export function assignLawyerToCase(caseId: string, lawyerId?: string, lawyerName?: string) {
  const current = getCases();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const updated = current.map((c) => {
    if (c.id !== caseId) return c;
    const newStatus: CaseStatus = lawyerId
      ? c.status === "Submitted"
        ? "Assigned"
        : c.status
      : c.status;
    const note = lawyerName ? `Assigned to ${lawyerName}` : "Unassigned by admin";
    const timeline = [
      ...(c.timeline || []),
      { id: `t_${Date.now()}`, status: newStatus, at: today, time, note },
    ];
    return {
      ...c,
      lawyerId: lawyerId || undefined,
      lawyerName: lawyerName || undefined,
      status: newStatus,
      updatedAt: today,
      timeline,
    };
  });

  saveCases(updated);

  if (lawyerName) {
    addNotification({
      title: "Lawyer Appointed",
      body: `${lawyerName} has been assigned to your case ${caseId}.`,
    });
  }
}

export function updateCaseFields(id: string, patch: Partial<LegalCase>) {
  const current = getCases();
  const updated = current.map((c) =>
    c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString().slice(0, 10) } : c,
  );
  saveCases(updated);
}

export function addCaseAttachments(caseId: string, docs: CaseDocument[]) {
  const current = getCases();
  const today = new Date().toISOString().slice(0, 10);
  const updated = current.map((c) =>
    c.id === caseId ? { ...c, files: { files: [...c.files.files, ...docs] }, updatedAt: today } : c,
  );
  saveCases(updated);

  const found = updated.find((c) => c.id === caseId);
  if (found) {
    addNotification({
      title: "New Attachment Added",
      body: `${docs.length} new attachment${docs.length === 1 ? "" : "s"} added to case ${caseId} (${found.title}).`,
    });
  }
}

/* ── COURT HISTORY (per-case, caseDetails.historyOfCaseHearings) ─────────── */
export function addCourtHearing(caseId: string, hearing: HistoryOfHearing) {
  const current = getCases();
  const updated = current.map((c) =>
    c.id === caseId
      ? {
          ...c,
          caseDetails: {
            ...c.caseDetails,
            historyOfCaseHearings: [...c.caseDetails.historyOfCaseHearings, hearing],
          },
        }
      : c,
  );
  saveCases(updated);

  const found = updated.find((c) => c.id === caseId);
  if (found) {
    addNotification({
      title: "Hearing Scheduled",
      body: `A hearing for case ${caseId} (${found.title}) has been scheduled on ${hearing.hearingDate ?? hearing.businessOnDate}.`,
    });
  }
}

export function updateCourtHearing(
  caseId: string,
  index: number,
  patch: Partial<HistoryOfHearing>,
) {
  const current = getCases();
  const updated = current.map((c) => {
    if (c.id !== caseId) return c;
    return {
      ...c,
      caseDetails: {
        ...c.caseDetails,
        historyOfCaseHearings: c.caseDetails.historyOfCaseHearings.map((h, i) =>
          i === index ? { ...h, ...patch } : h,
        ),
      },
    };
  });
  saveCases(updated);

  const found = updated.find((c) => c.id === caseId);
  if (found) {
    addNotification({
      title: "Hearing Updated",
      body: `A hearing for case ${caseId} (${found.title}) was updated.`,
    });
  }
}

export function deleteCourtHearing(caseId: string, index: number) {
  const current = getCases();
  const updated = current.map((c) =>
    c.id === caseId
      ? {
          ...c,
          caseDetails: {
            ...c.caseDetails,
            historyOfCaseHearings: c.caseDetails.historyOfCaseHearings.filter(
              (_, i) => i !== index,
            ),
          },
        }
      : c,
  );
  saveCases(updated);
}

/* ── CASE NOTES (per-case) ───────────────────────────────────────────────── */
export function getCaseNotes(caseId: string): CaseNote[] {
  const all = load<CaseNote[]>(NOTES_KEY, []);
  return all
    .filter((n) => n.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addCaseNote(caseId: string, text: string, author = "You"): CaseNote {
  const all = load<CaseNote[]>(NOTES_KEY, []);
  const note: CaseNote = {
    id: `note_${Date.now()}`,
    caseId,
    text,
    author,
    createdAt: new Date().toISOString(),
  };
  save(NOTES_KEY, [note, ...all]);
  return note;
}

export function deleteCaseNote(noteId: string) {
  const all = load<CaseNote[]>(NOTES_KEY, []);
  save(
    NOTES_KEY,
    all.filter((n) => n.id !== noteId),
  );
}

/* ── LAWYERS STORE ───────────────────────────────────────────────────────── */
export function getLawyers(): Lawyer[] {
  return load<Lawyer[]>(LAWYERS_KEY, seedLawyers);
}

export function saveLawyers(lawyers: Lawyer[]) {
  save(LAWYERS_KEY, lawyers);
}

export function addLawyer(
  lawyer: Omit<Lawyer, "id" | "rating" | "activeCases" | "joinedAt">,
): Lawyer {
  const current = getLawyers();
  const newLawyer: Lawyer = {
    ...lawyer,
    id: `l_${Date.now()}`,
    rating: 5.0,
    activeCases: 0,
    joinedAt: new Date().toISOString().slice(0, 10),
  };
  saveLawyers([newLawyer, ...current]);
  return newLawyer;
}

export function updateLawyerStatus(id: string, status: Lawyer["status"]) {
  const current = getLawyers();
  const updated = current.map((l) => (l.id === id ? { ...l, status } : l));
  saveLawyers(updated);
}

export function updateLawyerProfile(id: string, fields: Partial<Lawyer>) {
  const current = getLawyers();
  const updated = current.map((l) => (l.id === id ? { ...l, ...fields } : l));
  saveLawyers(updated);
}

/* ── LAWYER RATINGS & REVIEWS STORE ──────────────────────────────────────── */
export interface LawyerRatingRecord {
  id: string;
  lawyerId: string;
  caseId: string;
  rating: number; // 0 - 5
  feedback: string;
  citizenName?: string;
  createdAt: string;
  updatedAt: string;
}

export function getLawyerRatings(): LawyerRatingRecord[] {
  return load<LawyerRatingRecord[]>(LAWYER_RATINGS_KEY, []);
}

export function getLawyerRatingForCase(
  caseId: string,
  lawyerId: string,
): LawyerRatingRecord | undefined {
  const all = getLawyerRatings();
  return all.find((r) => r.caseId === caseId && r.lawyerId === lawyerId);
}

/**
 * Mathematical formulation for dynamic rating averaging:
 *
 * Case A (New rating):
 * - Previous rating count: N_old (defaults to lawyer.ratingCount || 1)
 * - Previous average rating: R_old (defaults to lawyer.rating || 5.0)
 * - Previous sum of ratings: S_old = R_old * N_old
 * - New total ratings count: N_new = N_old + 1
 * - New sum of ratings: S_new = S_old + r
 * - New average rating: R_new = S_new / N_new = ((R_old * N_old) + r) / (N_old + 1)
 *
 * Case B (Updating an existing rating for the same case):
 * - Previous rating on this case: r_prev
 * - Total count remains unchanged: N_new = N_old
 * - New sum of ratings: S_new = S_old - r_prev + r
 * - New average rating: R_new = S_new / N_new
 *
 * Clamping & Rounding:
 * - R_clamped = Math.min(5, Math.max(0, R_new))
 * - R_display = Number(R_clamped.toFixed(1))
 */
export function submitLawyerRating({
  lawyerId,
  caseId,
  rating,
  feedback = "",
  citizenName,
}: {
  lawyerId: string;
  caseId: string;
  rating: number;
  feedback?: string;
  citizenName?: string;
}): { newRating: number; newRatingCount: number } {
  // Clamp input rating strictly between 0 and 5
  const clampedRating = Math.min(5, Math.max(0, rating));
  const now = new Date().toISOString();

  const allRatings = getLawyerRatings();
  const existingIndex = allRatings.findIndex(
    (r) => r.caseId === caseId && r.lawyerId === lawyerId,
  );
  const existingRecord = existingIndex >= 0 ? allRatings[existingIndex] : undefined;

  const lawyers = getLawyers();
  const lawyer = lawyers.find((l) => l.id === lawyerId);

  let newRating = clampedRating;
  let newRatingCount = 1;

  if (lawyer) {
    const oldCount = lawyer.ratingCount ?? (lawyer.rating ? 1 : 0);
    const oldAverage = lawyer.rating ?? 5.0;
    const oldSum = oldAverage * oldCount;

    if (existingRecord) {
      // Citizen is updating an existing review for this case
      const prevRating = existingRecord.rating;
      newRatingCount = Math.max(1, oldCount);
      const newSum = oldSum - prevRating + clampedRating;
      newRating = Number((newSum / newRatingCount).toFixed(1));
    } else {
      // First-time review for this case
      newRatingCount = oldCount + 1;
      const newSum = oldSum + clampedRating;
      newRating = Number((newSum / newRatingCount).toFixed(1));
    }

    newRating = Math.min(5, Math.max(0, newRating));

    // Save updated lawyer profile
    const updatedLawyers = lawyers.map((l) =>
      l.id === lawyerId
        ? {
            ...l,
            rating: newRating,
            ratingCount: newRatingCount,
          }
        : l,
    );
    saveLawyers(updatedLawyers);
  }

  // Save or update the rating submission record
  let updatedRatings: LawyerRatingRecord[];
  if (existingIndex >= 0) {
    updatedRatings = allRatings.map((r, i) =>
      i === existingIndex
        ? {
            ...r,
            rating: clampedRating,
            feedback,
            citizenName: citizenName || r.citizenName,
            updatedAt: now,
          }
        : r,
    );
  } else {
    const newRecord: LawyerRatingRecord = {
      id: `rev_${Date.now()}`,
      lawyerId,
      caseId,
      rating: clampedRating,
      feedback,
      citizenName,
      createdAt: now,
      updatedAt: now,
    };
    updatedRatings = [newRecord, ...allRatings];
  }
  save(LAWYER_RATINGS_KEY, updatedRatings);

  if (lawyer) {
    addNotification({
      title: "Rating Submitted",
      body: `You rated ${lawyer.name} ${clampedRating}/5 stars. Average rating is now ${newRating.toFixed(1)} (${newRatingCount}).`,
    });
  }

  return { newRating, newRatingCount };
}

/* ── CITIZENS STORE ──────────────────────────────────────────────────────── */
export function getCitizens(): Citizen[] {
  return load<Citizen[]>(CITIZENS_KEY, seedCitizens);
}

export function saveCitizens(citizens: Citizen[]) {
  save(CITIZENS_KEY, citizens);
}

export function updateCitizenStatus(id: string, status: Citizen["status"]) {
  const current = getCitizens();
  const updated = current.map((c) => (c.id === id ? { ...c, status } : c));
  saveCitizens(updated);
}

export function updateCitizenProfile(
  id: string,
  fields: Partial<Pick<Citizen, "name" | "email" | "phone" | "city" | "currentLocation">>,
) {
  const current = getCitizens();
  const updated = current.map((c) => (c.id === id ? { ...c, ...fields } : c));
  saveCitizens(updated);
}

/* ── ADMIN PROFILE STORE ─────────────────────────────────────────────────── */
export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
}

const ADMIN_PROFILE_KEY = "cuc_admin_profile_v1";

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  name: "Platform Ops",
  email: "ops@closeur.legal",
  phone: "+91 90000 11122",
  city: "Hyderabad",
};

export function getAdminProfile(): AdminProfile {
  return load<AdminProfile>(ADMIN_PROFILE_KEY, DEFAULT_ADMIN_PROFILE);
}

export function updateAdminProfile(fields: Partial<AdminProfile>) {
  save(ADMIN_PROFILE_KEY, { ...getAdminProfile(), ...fields });
}

/* ── NOTIFICATIONS STORE ─────────────────────────────────────────────────── */
export function getNotifications(role?: UserRole): AppNotification[] {
  const all = load<AppNotification[]>(NOTIFICATIONS_KEY, seedNotifications);
  if (!role) return all;
  return all.filter((n) => !n.role || n.role === "all" || n.role === role);
}

export function saveNotifications(notifications: AppNotification[]) {
  save(NOTIFICATIONS_KEY, notifications);
}

export function addNotification(n: { title: string; body: string; role?: UserRole | "all" }) {
  const current = load<AppNotification[]>(NOTIFICATIONS_KEY, seedNotifications);
  const todayTime = new Date().toISOString().replace("T", " ").slice(0, 16);
  const newNotif: AppNotification = {
    id: `n_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: n.title,
    body: n.body,
    at: todayTime,
    read: false,
    role: n.role || "citizen",
  };
  saveNotifications([newNotif, ...current]);
}

export function markNotificationRead(id: string) {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
}

export function markAllNotificationsRead() {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}

export function getRecentVideoCalls(role: UserRole): VideoCall[] {
  const all = load<VideoCall[]>(VIDEO_CALLS_KEY, seedVideoCalls);
  return all
    .filter((call) => call.role === role)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function addVideoCall(entry: {
  caseId: string;
  withName: string;
  role: UserRole;
  status: VideoCall["status"];
  durationSeconds?: number;
}) {
  const current = load<VideoCall[]>(VIDEO_CALLS_KEY, seedVideoCalls);
  const call: VideoCall = {
    id: `vc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    caseId: entry.caseId,
    withName: entry.withName,
    at: new Date().toISOString(),
    durationSeconds: entry.durationSeconds,
    status: entry.status,
    role: entry.role,
  };
  save(VIDEO_CALLS_KEY, [call, ...current]);
}

export function deleteNotification(id: string) {
  const current = getNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(updated);
}

/* ── PROFILE PHOTOS STORE ────────────────────────────────────────────────── */
export function getProfilePhoto(role: UserRole): string | undefined {
  const all = load<Partial<Record<UserRole, string>>>(PROFILE_PHOTOS_KEY, {});
  return all[role];
}

export function setProfilePhoto(role: UserRole, dataUrl: string) {
  const all = load<Partial<Record<UserRole, string>>>(PROFILE_PHOTOS_KEY, {});
  save(PROFILE_PHOTOS_KEY, { ...all, [role]: dataUrl });
}

export function clearProfilePhoto(role: UserRole) {
  const all = load<Partial<Record<UserRole, string>>>(PROFILE_PHOTOS_KEY, {});
  const { [role]: _removed, ...rest } = all;
  save(PROFILE_PHOTOS_KEY, rest);
}

/* ── KNOWLEDGE BASE STORE ────────────────────────────────────────────────── */
export function getKnowledgeBase(): KnowledgeItem[] {
  return load<KnowledgeItem[]>(KB_KEY, seedKnowledgeBase);
}

export function saveKnowledgeBase(kb: KnowledgeItem[]) {
  save(KB_KEY, kb);
}

export function addKnowledgeItem(item: Omit<KnowledgeItem, "id" | "uploadedAt">): KnowledgeItem {
  const current = getKnowledgeBase();
  const newItem: KnowledgeItem = {
    ...item,
    id: `k_${Date.now()}`,
    uploadedAt: new Date().toISOString().slice(0, 10),
  };
  saveKnowledgeBase([newItem, ...current]);
  return newItem;
}

export function deleteKnowledgeItem(id: string) {
  const current = getKnowledgeBase();
  const updated = current.filter((k) => k.id !== id);
  saveKnowledgeBase(updated);
}

/* ── LAWYER PERSONAL DOCUMENTS STORE ("My Docs") ────────────────────────────
   Separate from the admin-curated KnowledgeItem index ("Global Docs") — each
   Lawyer only ever sees and manages their own documents here. */
function getAllLawyerDocuments(): LawyerDocument[] {
  return load<LawyerDocument[]>(LAWYER_DOCS_KEY, []);
}

export function getLawyerDocuments(lawyerId: string): LawyerDocument[] {
  return getAllLawyerDocuments().filter((d) => d.lawyerId === lawyerId);
}

export function addLawyerDocument(doc: Omit<LawyerDocument, "id" | "uploadedAt">): LawyerDocument {
  const current = getAllLawyerDocuments();
  const newDoc: LawyerDocument = {
    ...doc,
    id: `ld_${Date.now()}`,
    uploadedAt: new Date().toISOString().slice(0, 10),
  };
  save(LAWYER_DOCS_KEY, [newDoc, ...current]);
  return newDoc;
}

export function deleteLawyerDocument(id: string) {
  const updated = getAllLawyerDocuments().filter((d) => d.id !== id);
  save(LAWYER_DOCS_KEY, updated);
}

/* ── SUBSCRIPTIONS STORE ("My Subscriptions") ────────────────────────────── */
export function getSubscriptions(citizenId?: string): Subscription[] {
  const all = load<Subscription[]>(SUBSCRIPTIONS_KEY, seedSubscriptions);
  const sorted = [...all].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return citizenId ? sorted.filter((s) => s.citizenId === citizenId) : sorted;
}

export function addSubscription(
  sub: Omit<Subscription, "id" | "startedAt" | "status">,
): Subscription {
  const current = load<Subscription[]>(SUBSCRIPTIONS_KEY, seedSubscriptions);
  // A citizen only has one active plan at a time — starting a new one
  // supersedes whichever plan they were previously on.
  const withPriorExpired = current.map((s) =>
    s.citizenId === sub.citizenId && s.status === "Active"
      ? { ...s, status: "Expired" as const }
      : s,
  );
  const newSub: Subscription = {
    ...sub,
    id: `sub_${Date.now()}`,
    startedAt: new Date().toISOString().slice(0, 10),
    status: "Active",
  };
  save(SUBSCRIPTIONS_KEY, [newSub, ...withPriorExpired]);

  addNotification({
    title: "Subscription Activated",
    body: `Your ${sub.planLabel} Auto-Assign plan (₹${sub.amount}) is now active.`,
  });

  return newSub;
}

/* ── PAYMENTS STORE (Revenue tabs) ───────────────────────────────────────── */
export function getPayments(lawyerId?: string): Payment[] {
  const all = load<Payment[]>(PAYMENTS_KEY, seedPayments);
  const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
  return lawyerId ? sorted.filter((p) => p.lawyerId === lawyerId) : sorted;
}

/* ── WITHDRAWAL REQUESTS STORE ───────────────────────────────────────────── */
const WITHDRAWALS_KEY = "cuc_withdrawals_v3";

const seedWithdrawals: WithdrawalRequest[] = [
  {
    id: "w_101",
    lawyerId: "l_001",
    lawyerName: "Sai Teja Reddy",
    amount: 12240,
    requestedAt: "2026-09-02",
    status: "Approved",
    bankName: "HDFC Bank Ltd",
    accountNumber: "•••• 4829",
    ifscCode: "HDFC0001234",
    processedAt: "2026-09-02",
    referenceId: "TXN_94820194",
  },
  {
    id: "w_102",
    lawyerId: "l_002",
    lawyerName: "Ananya Sharma",
    amount: 8500,
    requestedAt: "2026-09-06",
    status: "Pending",
    bankName: "State Bank of India",
    accountNumber: "•••• 9102",
    ifscCode: "SBIN0004812",
  },
  {
    id: "w_103",
    lawyerId: "l_003",
    lawyerName: "Rajesh Kumar",
    amount: 15400,
    requestedAt: "2026-09-07",
    status: "Pending",
    bankName: "ICICI Bank",
    accountNumber: "•••• 3391",
    ifscCode: "ICIC0000281",
  },
  {
    id: "w_104",
    lawyerId: "l_004",
    lawyerName: "Meera Nair",
    amount: 22000,
    requestedAt: "2026-09-07",
    status: "Pending",
    bankName: "Axis Bank",
    accountNumber: "•••• 7714",
    ifscCode: "UTIB0001092",
  },
];

export function getWithdrawalRequests(lawyerId?: string): WithdrawalRequest[] {
  const all = load<WithdrawalRequest[]>(WITHDRAWALS_KEY, seedWithdrawals);
  const sorted = [...all].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  return lawyerId ? sorted.filter((w) => w.lawyerId === lawyerId) : sorted;
}

export function addWithdrawalRequest(
  req: Omit<WithdrawalRequest, "id" | "requestedAt" | "status">,
): WithdrawalRequest {
  const current = load<WithdrawalRequest[]>(WITHDRAWALS_KEY, seedWithdrawals);
  const today = new Date().toISOString().slice(0, 10);
  const newReq: WithdrawalRequest = {
    ...req,
    id: `w_${Date.now()}`,
    requestedAt: today,
    status: "Pending",
  };

  save(WITHDRAWALS_KEY, [newReq, ...current]);

  addNotification({
    title: "New Withdrawal Request",
    body: `${req.lawyerName} submitted a payout withdrawal request of ₹${req.amount.toLocaleString("en-IN")}.`,
    role: "admin",
  });

  return newReq;
}

export function approveWithdrawalRequest(id: string): WithdrawalRequest | undefined {
  const current = load<WithdrawalRequest[]>(WITHDRAWALS_KEY, seedWithdrawals);
  const today = new Date().toISOString().slice(0, 10);
  const refId = `TXN_${Date.now().toString().slice(-8)}`;

  let approvedReq: WithdrawalRequest | undefined;

  const updated = current.map((w) => {
    if (w.id !== id) return w;
    approvedReq = {
      ...w,
      status: "Approved" as const,
      processedAt: today,
      referenceId: refId,
    };
    return approvedReq;
  });

  save(WITHDRAWALS_KEY, updated);

  if (approvedReq) {
    addNotification({
      title: "Withdrawal Approved",
      body: `Your payout of ₹${approvedReq.amount.toLocaleString("en-IN")} has been approved and transferred to your bank account (${approvedReq.bankName}).`,
      role: "lawyer",
    });
  }

  return approvedReq;
}

export function rejectWithdrawalRequest(id: string, reason?: string): WithdrawalRequest | undefined {
  const current = load<WithdrawalRequest[]>(WITHDRAWALS_KEY, seedWithdrawals);
  let rejectedReq: WithdrawalRequest | undefined;

  const updated = current.map((w) => {
    if (w.id !== id) return w;
    rejectedReq = {
      ...w,
      status: "Rejected" as const,
      rejectionReason: reason || "Bank details verification mismatch",
    };
    return rejectedReq;
  });

  save(WITHDRAWALS_KEY, updated);

  if (rejectedReq) {
    addNotification({
      title: "Withdrawal Request Rejected",
      body: `Your payout request of ₹${rejectedReq.amount.toLocaleString("en-IN")} was rejected. Reason: ${reason || "Verification mismatch"}.`,
      role: "lawyer",
    });
  }

  return rejectedReq;
}
