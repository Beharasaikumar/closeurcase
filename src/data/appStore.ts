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
  CaseCategoryItem,
  CaseSubCategoryItem,
  LanguageItem,
  CityItem,
  CourtItem,
  StateItem,
  CourtLevelItem,
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
const CASE_CATEGORIES_KEY = "cuc_case_categories_v3";
const LANGUAGES_KEY = "cuc_languages_v1";
const CITIES_KEY = "cuc_cities_v2";
const COURTS_KEY = "cuc_courts_v2";
const STATES_KEY = "cuc_states_v1";
const COURT_LEVELS_KEY = "cuc_court_levels_v1";

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
  const existingIndex = allRatings.findIndex((r) => r.caseId === caseId && r.lawyerId === lawyerId);
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

/** A citizen's membership tier, derived from their real subscription history —
 * NOT a name hash. An active `yearly` plan is Gold, an active `monthly` plan
 * is Silver, and everyone else (free, expired, cancelled, or no plan) is
 * Bronze. Accepts a citizen id ("u_003") or a display name.
 * Returns `null` for anyone who isn't a known citizen. */
export function planTierForCitizen(idOrName: string): "gold" | "silver" | "bronze" | null {
  const key = idOrName.trim();
  const citizen = key.startsWith("u_")
    ? seedCitizens.find((c) => c.id === key)
    : seedCitizens.find((c) => c.name.toLowerCase() === key.toLowerCase());
  if (!citizen) return null;

  const subs = getSubscriptions(citizen.id);
  const active = subs.find((s) => s.status === "Active");
  if (active?.planId === "yearly") return "gold";
  if (active?.planId === "monthly") return "silver";
  return "bronze";
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
  // Adv. Swathi Reddy (l_001) — the demo lawyer; a settled payout from CS-22418.
  {
    id: "w_101",
    lawyerId: "l_001",
    lawyerName: "Swathi Reddy",
    amount: 12240,
    requestedAt: "2026-09-02",
    status: "Approved",
    bankName: "HDFC Bank Ltd",
    accountNumber: "•••• 4829",
    ifscCode: "HDFC0001234",
    processedAt: "2026-09-03",
    referenceId: "TXN_94820194",
  },
  // Srinivas Chowdary (l_002) — pending; matches the ₹8,500 admin notification.
  {
    id: "w_102",
    lawyerId: "l_002",
    lawyerName: "Srinivas Chowdary",
    amount: 8500,
    requestedAt: "2026-09-06",
    status: "Pending",
    bankName: "State Bank of India",
    accountNumber: "•••• 9102",
    ifscCode: "SBIN0004812",
  },
  // Sailaja Naidu (l_003) — pending payout from the resolved divorce matter.
  {
    id: "w_103",
    lawyerId: "l_003",
    lawyerName: "Sailaja Naidu",
    amount: 15400,
    requestedAt: "2026-09-07",
    status: "Pending",
    bankName: "ICICI Bank",
    accountNumber: "•••• 3391",
    ifscCode: "ICIC0000281",
  },
  // Venkatesh Rao (l_004) — pending.
  {
    id: "w_104",
    lawyerId: "l_004",
    lawyerName: "Venkatesh Rao",
    amount: 16800,
    requestedAt: "2026-09-07",
    status: "Pending",
    bankName: "Axis Bank",
    accountNumber: "•••• 7714",
    ifscCode: "UTIB0001092",
  },
  // Suresh Kumar (l_018) — an earlier rejected request (stale bank details).
  {
    id: "w_105",
    lawyerId: "l_018",
    lawyerName: "Suresh Kumar",
    amount: 6800,
    requestedAt: "2026-08-24",
    status: "Rejected",
    bankName: "Union Bank of India",
    accountNumber: "•••• 5567",
    ifscCode: "UBIN0553441",
    processedAt: "2026-08-26",
    rejectionReason: "Account name mismatch — please re-submit with updated bank proof.",
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

export function rejectWithdrawalRequest(
  id: string,
  reason?: string,
): WithdrawalRequest | undefined {
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

/* ── DATA MANAGEMENT STORE (CRUD for Categories, Languages, Cities, Courts) ── */

/**
 * Master case taxonomy — the single source of truth for the public "Find a
 * Lawyer" menu (via `getPracticeAreaTree()` / `lawyerPracticeAreas.ts`) and the
 * admin Data Management → Categories tab. Three tiers: category → sub-category
 * → legal services. The nine browse practice areas plus Cyber/Tax/Environmental
 * for internal lawyer/case classification.
 */
export const DEFAULT_CASE_CATEGORIES: CaseCategoryItem[] = [
  {
    id: "cat_1",
    name: "Criminal Defense",
    code: "CRIM",
    description: "Bail, trials, appeals, and white-collar defence across criminal courts",
    subCategories: [
      {
        name: "Anticipatory Bail",
        services: [
          "File Anticipatory Bail Application",
          "Anticipatory Bail Hearing",
          "Anticipatory Bail Appeal",
        ],
      },
      {
        name: "Criminal",
        services: [
          "File Criminal Case",
          "Criminal Defense",
          "Criminal Case Consultation",
          "Criminal Appeal",
          "Criminal Revision",
        ],
      },
      {
        name: "Cyber Crime",
        services: [
          "Cyber Crime Complaint",
          "Cyber Fraud Case",
          "Online Harassment Case",
          "Cyber Crime Defense",
          "Cyber Crime Investigation Assistance",
        ],
      },
      {
        name: "Fraud Case",
        services: [
          "File Fraud Case",
          "Fraud Case Defense",
          "Financial Fraud Complaint",
          "Fraud Case Appeal",
        ],
      },
      {
        name: "Litigation",
        services: [
          "Civil Litigation",
          "Criminal Litigation",
          "Court Representation",
          "File Lawsuit",
          "Litigation Consultation",
        ],
      },
      {
        name: "POCSO Act",
        services: [
          "POCSO Case Filing",
          "POCSO Case Defense",
          "POCSO Bail Application",
          "POCSO Case Representation",
          "POCSO Appeal",
        ],
      },
      {
        name: "Anti Corruption",
        services: [
          "Anti Corruption Complaint",
          "Anti Corruption Case Defense",
          "Vigilance Case",
          "Anti Corruption Litigation",
        ],
      },
      {
        name: "PMLA",
        services: [
          "PMLA Case Defense",
          "PMLA Bail Application",
          "PMLA Property Attachment Matter",
          "PMLA Case Representation",
          "PMLA Appeal",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_2",
    name: "Corporate Law",
    code: "CORP",
    description: "Arbitration, company law, NCLT, insolvency, IP, and commercial contracts",
    subCategories: [
      {
        name: "Arbitration",
        services: [
          "Arbitration Consultation",
          "File Arbitration Case",
          "Arbitration Representation",
          "Arbitration Award Challenge",
          "Arbitration Appeal",
        ],
      },
      {
        name: "Startup",
        services: [
          "Startup Legal Consultation",
          "Business Registration",
          "Founder Agreement",
          "Shareholder Agreement",
          "Startup Compliance",
        ],
      },
      {
        name: "Corporate",
        services: [
          "Corporate Legal Consultation",
          "Company Law Compliance",
          "Corporate Dispute",
          "Board and Shareholder Matters",
          "Corporate Representation",
        ],
      },
      {
        name: "Breach of Contract",
        services: [
          "Contract Review",
          "Breach of Contract Notice",
          "Breach of Contract Case",
          "Contract Dispute Resolution",
          "Contract Litigation",
        ],
      },
      {
        name: "NCLT",
        services: [
          "NCLT Case Filing",
          "NCLT Representation",
          "Company Petition",
          "NCLT Appeal",
          "Corporate Insolvency Matter",
        ],
      },
      {
        name: "Bankruptcy / Insolvency",
        services: [
          "Insolvency Consultation",
          "Insolvency Proceedings",
          "Bankruptcy Proceedings",
          "IBC Case Filing",
          "Insolvency Representation",
        ],
      },
      {
        name: "Patent",
        services: [
          "Patent Search",
          "Patent Application",
          "Patent Registration",
          "Patent Infringement Case",
          "Patent Opposition",
        ],
      },
      {
        name: "Media and Entertainment",
        services: [
          "Media Legal Consultation",
          "Entertainment Contract",
          "Copyright Dispute",
          "Defamation Matter",
          "Media Litigation",
        ],
      },
      {
        name: "Trademark & Copyright",
        services: [
          "Trademark Search",
          "Trademark Registration",
          "Trademark Infringement",
          "Copyright Registration",
          "Copyright Infringement",
        ],
      },
      {
        name: "Documentation",
        services: [
          "Legal Document Drafting",
          "Agreement Drafting",
          "Contract Drafting",
          "Document Review",
          "Legal Documentation",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_3",
    name: "Family Law",
    code: "FAM",
    description: "Divorce, custody, maintenance, wills, and domestic relations",
    subCategories: [
      {
        name: "Wills / Trusts",
        services: [
          "Will Drafting",
          "Will Registration",
          "Will Review",
          "Trust Deed Drafting",
          "Trust Registration",
        ],
      },
      {
        name: "Child Custody",
        services: [
          "Child Custody Case",
          "Child Custody Petition",
          "Child Visitation Matter",
          "Child Custody Dispute",
          "Child Custody Appeal",
        ],
      },
      {
        name: "Muslim Law",
        services: [
          "Muslim Marriage Matter",
          "Muslim Divorce Matter",
          "Muslim Personal Law Consultation",
          "Muslim Inheritance Matter",
          "Muslim Family Dispute",
        ],
      },
      {
        name: "Domestic Violence",
        services: [
          "Domestic Violence Complaint",
          "Domestic Violence Case",
          "Protection Order",
          "Domestic Violence Defense",
          "Domestic Violence Appeal",
        ],
      },
      {
        name: "Succession Certificate",
        services: [
          "Succession Certificate Application",
          "Succession Certificate Case",
          "Succession Certificate Consultation",
          "Succession Certificate Appeal",
        ],
      },
      {
        name: "Divorce",
        services: [
          "File for Divorce",
          "Reply / Send Legal Notice for Divorce",
          "Contest Divorce Case",
          "Divorce Appeal",
          "Mutual Consent Divorce",
          "Contested Divorce",
          "Divorce Settlement",
        ],
      },
      {
        name: "Family",
        services: [
          "Family Dispute",
          "Family Settlement",
          "Maintenance Matter",
          "Family Court Representation",
          "Family Legal Consultation",
        ],
      },
      {
        name: "Court Marriage",
        services: [
          "Court Marriage Registration",
          "Marriage Registration",
          "Special Marriage Act Registration",
          "Court Marriage Documentation",
        ],
      },
      {
        name: "Dowry Case",
        services: [
          "Dowry Complaint",
          "Dowry Harassment Case",
          "Dowry Case Defense",
          "Dowry Case Representation",
          "Dowry Case Appeal",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_4",
    name: "Banking & Finance",
    code: "BANK",
    description: "Cheque bounce, debt recovery, banking disputes, GST, and customs",
    subCategories: [
      {
        name: "Cheque Bounce",
        services: [
          "Cheque Bounce Legal Notice",
          "File Cheque Bounce Case",
          "Cheque Bounce Case Defense",
          "Cheque Bounce Settlement",
          "Cheque Bounce Appeal",
        ],
      },
      {
        name: "Recovery",
        services: [
          "Money Recovery Notice",
          "Debt Recovery Case",
          "Loan Recovery Matter",
          "Recovery Suit",
          "Debt Settlement",
        ],
      },
      {
        name: "Tax",
        services: [
          "Tax Consultation",
          "Income Tax Matter",
          "Tax Notice Reply",
          "Tax Dispute",
          "Tax Appeal",
        ],
      },
      {
        name: "Banking / Finance",
        services: [
          "Banking Dispute",
          "Loan Dispute",
          "Banking Legal Notice",
          "Financial Agreement Review",
          "Banking Litigation",
        ],
      },
      {
        name: "GST",
        services: [
          "GST Registration",
          "GST Notice Reply",
          "GST Compliance",
          "GST Dispute",
          "GST Appeal",
        ],
      },
      {
        name: "Customs & Central Excise",
        services: [
          "Customs Consultation",
          "Customs Dispute",
          "Customs Notice Reply",
          "Central Excise Matter",
          "Customs Appeal",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_5",
    name: "Consumer Law",
    code: "CONS",
    description: "Consumer forum complaints, insurance, medical negligence, and motor accidents",
    subCategories: [
      {
        name: "Insurance",
        services: [
          "Insurance Claim Dispute",
          "Insurance Claim Rejection",
          "Insurance Legal Notice",
          "Insurance Consumer Case",
          "Insurance Appeal",
        ],
      },
      {
        name: "Medical Negligence",
        services: [
          "Medical Negligence Consultation",
          "Medical Negligence Complaint",
          "Medical Negligence Case",
          "Medical Negligence Consumer Case",
          "Medical Negligence Defense",
        ],
      },
      {
        name: "Motor Accident",
        services: [
          "Motor Accident Claim",
          "Motor Accident Compensation",
          "Motor Accident Case",
          "Motor Accident Tribunal Matter",
          "Motor Accident Appeal",
        ],
      },
      {
        name: "Consumer Court",
        services: [
          "Consumer Complaint",
          "Consumer Legal Notice",
          "Consumer Court Representation",
          "Consumer Dispute",
          "Consumer Court Appeal",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_6",
    name: "Higher Courts",
    code: "HCRT",
    description: "Supreme Court, High Court, writs, SLPs, and tribunal representation",
    subCategories: [
      {
        name: "Armed Forces Tribunal",
        services: [
          "AFT Case Filing",
          "AFT Representation",
          "Service Matter Appeal",
          "Armed Forces Legal Consultation",
        ],
      },
      {
        name: "Supreme Court",
        services: [
          "Supreme Court Case Filing",
          "Supreme Court Representation",
          "Special Leave Petition (SLP)",
          "Supreme Court Appeal",
          "Supreme Court Legal Consultation",
        ],
      },
      {
        name: "High Court",
        services: [
          "High Court Case Filing",
          "High Court Representation",
          "Writ Petition",
          "High Court Appeal",
          "High Court Bail Application",
          "High Court Legal Consultation",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_7",
    name: "International Law",
    code: "INTL",
    description: "Immigration, cross-border disputes, and NRI legal matters",
    subCategories: [
      {
        name: "Immigration",
        services: [
          "Immigration Consultation",
          "Visa Legal Assistance",
          "Immigration Application",
          "Immigration Appeal",
          "Immigration Dispute",
        ],
      },
      {
        name: "International Law",
        services: [
          "International Legal Consultation",
          "Cross Border Dispute",
          "International Contract Matter",
          "International Arbitration",
          "International Litigation",
        ],
      },
      {
        name: "NRI",
        services: [
          "NRI Legal Consultation",
          "NRI Property Matter",
          "NRI Family Dispute",
          "NRI Documentation",
          "NRI Power of Attorney",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_8",
    name: "Labour & Civil Matters",
    code: "LAB",
    description: "Employment disputes, service matters, RTI, and civil suits",
    subCategories: [
      {
        name: "Labour & Service",
        services: [
          "Employment Dispute",
          "Wrongful Termination Matter",
          "Salary / Wage Dispute",
          "Service Matter",
          "Labour Court Case",
        ],
      },
      {
        name: "R.T.I",
        services: ["RTI Application", "RTI Appeal", "RTI Legal Consultation", "RTI Complaint"],
      },
      {
        name: "Civil",
        services: [
          "Civil Suit",
          "Civil Dispute",
          "Civil Litigation",
          "Civil Appeal",
          "Civil Legal Notice",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_9",
    name: "Property Law",
    code: "PROP",
    description: "Land titles, landlord-tenant, RERA, and real-estate litigation",
    subCategories: [
      {
        name: "Landlord/Tenant",
        services: [
          "Landlord / Tenant Dispute",
          "Rent Agreement",
          "Eviction Matter",
          "Rent Recovery",
          "Tenant Rights Matter",
          "Landlord Rights Matter",
        ],
      },
      {
        name: "Property",
        services: [
          "Property Dispute",
          "Property Documentation",
          "Property Verification",
          "Property Sale Agreement",
          "Transfer of Ownership",
          "Property Registration",
          "Illegal Possession",
          "Illegal Construction",
          "Ancestral Property Dispute",
        ],
      },
      {
        name: "RERA",
        services: [
          "RERA Complaint",
          "RERA Case Filing",
          "Builder Delay Case",
          "Builder Fraud Case",
          "Property Possession Dispute",
          "RERA Appeal",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_10",
    name: "Cyber",
    code: "CYB",
    description: "Cybercrime, IT Act offences, digital fraud, and online privacy",
    subCategories: [
      {
        name: "Cyber Crime Complaint",
        services: [
          "File Cyber Crime Complaint",
          "Cyber Crime FIR Assistance",
          "Cyber Cell Representation",
        ],
      },
      {
        name: "Online Harassment",
        services: [
          "Online Harassment Complaint",
          "Stalking / Threats Case",
          "Takedown Request",
          "John Doe Injunction",
        ],
      },
      {
        name: "Financial Cyber Fraud",
        services: [
          "UPI / Card Fraud Recovery",
          "Bank Liability Representation",
          "Cyber Fraud FIR & Follow-up",
        ],
      },
      {
        name: "Data Theft & Privacy",
        services: [
          "Data Breach Response",
          "Privacy Violation Notice",
          "Data Protection Compliance",
        ],
      },
      {
        name: "IT Act Offenses",
        services: ["IT Act Case Filing", "IT Act Defense", "IT Act Appeal"],
      },
      {
        name: "Social Media Impersonation",
        services: [
          "Impersonation Complaint",
          "Profile Takedown Request",
          "Defamation & Impersonation Suit",
        ],
      },
    ],
    active: true,
  },
  {
    id: "cat_11",
    name: "Tax",
    code: "TAX",
    description: "Direct/indirect tax appeals, GST disputes, and income-tax tribunals",
    subCategories: [
      {
        name: "Income Tax Appeals",
        services: [
          "CIT(A) Appeal Filing",
          "ITAT Representation",
          "Stay Application",
          "Rectification Petition",
        ],
      },
      {
        name: "GST Disputes & Filings",
        services: ["GST SCN Reply", "GST Appeal", "Input Tax Credit Dispute", "GST Refund Claim"],
      },
      {
        name: "Customs & Central Excise",
        services: ["Customs SCN Reply", "CESTAT Appeal", "Duty Drawback Matter"],
      },
      {
        name: "Tax Assessment Notices",
        services: ["Reassessment Notice Reply", "Scrutiny Assessment Support", "Assessment Appeal"],
      },
      {
        name: "Cheque Bounce (Sec 138)",
        services: ["Statutory Notice", "Section 138 Complaint", "Section 138 Defense"],
      },
      {
        name: "Debt Recovery Tribunal (DRT)",
        services: ["DRT Application", "SARFAESI Objection", "DRAT Appeal"],
      },
    ],
    active: true,
  },
  {
    id: "cat_12",
    name: "Environmental",
    code: "ENV",
    description: "NGT proceedings, pollution-control violations, and clearances",
    subCategories: [
      {
        name: "National Green Tribunal (NGT)",
        services: ["NGT Original Application", "NGT Representation", "NGT Appeal"],
      },
      {
        name: "Pollution Control Board Matters",
        services: ["Consent to Establish / Operate", "Closure Notice Reply", "PCB Appeal"],
      },
      {
        name: "Environmental Impact Clearance",
        services: [
          "EIA Clearance Application",
          "Clearance Condition Compliance",
          "Clearance Challenge",
        ],
      },
      {
        name: "Forest & Wildlife Regulations",
        services: ["Forest Clearance Matter", "Wildlife Permit Matter", "Encroachment Defense"],
      },
      {
        name: "Waste Management Compliance",
        services: [
          "Waste Rules Compliance Advice",
          "Violation Notice Reply",
          "Remediation Plan Support",
        ],
      },
    ],
    active: true,
  },
];

export const DEFAULT_LANGUAGES: LanguageItem[] = [
  { id: "lang_1", name: "English", nativeName: "English", code: "EN", active: true },
  { id: "lang_2", name: "Telugu", nativeName: "తెలుగు", code: "TE", active: true },
  { id: "lang_3", name: "Hindi", nativeName: "हिन्दी", code: "HI", active: true },
  { id: "lang_4", name: "Tamil", nativeName: "தமிழ்", code: "TA", active: true },
  { id: "lang_5", name: "Kannada", nativeName: "ಕನ್ನಡ", code: "KN", active: true },
  { id: "lang_6", name: "Malayalam", nativeName: "മലയാളം", code: "ML", active: true },
  { id: "lang_7", name: "Marathi", nativeName: "मराठी", code: "MR", active: true },
  { id: "lang_8", name: "Bengali", nativeName: "বাংলা", code: "BN", active: true },
  { id: "lang_9", name: "Gujarati", nativeName: "ગુજરાતી", code: "GU", active: true },
  { id: "lang_10", name: "Odia", nativeName: "ଓଡ଼ିଆ", code: "OR", active: true },
  { id: "lang_11", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", code: "PA", active: true },
  { id: "lang_12", name: "Urdu", nativeName: "اردو", code: "UR", active: true },
];

export const DEFAULT_CITIES: CityItem[] = [
  { id: "city_1", name: "Hyderabad", state: "Telangana", tier: "Tier 1", active: true },
  { id: "city_2", name: "Bengaluru", state: "Karnataka", tier: "Tier 1", active: true },
  { id: "city_3", name: "Mumbai", state: "Maharashtra", tier: "Tier 1", active: true },
  { id: "city_4", name: "New Delhi", state: "Delhi", tier: "Tier 1", active: true },
  { id: "city_5", name: "Chennai", state: "Tamil Nadu", tier: "Tier 1", active: true },
  { id: "city_6", name: "Kolkata", state: "West Bengal", tier: "Tier 1", active: true },
  { id: "city_7", name: "Pune", state: "Maharashtra", tier: "Tier 1", active: true },
  { id: "city_8", name: "Ahmedabad", state: "Gujarat", tier: "Tier 1", active: true },
  { id: "city_9", name: "Visakhapatnam", state: "Andhra Pradesh", tier: "Tier 2", active: true },
  { id: "city_10", name: "Vijayawada", state: "Andhra Pradesh", tier: "Tier 2", active: true },
  { id: "city_11", name: "Jaipur", state: "Rajasthan", tier: "Tier 2", active: true },
  { id: "city_12", name: "Lucknow", state: "Uttar Pradesh", tier: "Tier 2", active: true },
  { id: "city_13", name: "Chandigarh", state: "Chandigarh", tier: "Tier 2", active: true },
  { id: "city_14", name: "Kochi", state: "Kerala", tier: "Tier 2", active: true },
  { id: "city_15", name: "Indore", state: "Madhya Pradesh", tier: "Tier 2", active: true },
];

export const DEFAULT_COURTS: CourtItem[] = [
  {
    id: "crt_1",
    name: "Supreme Court of India",
    level: "Supreme Court",
    state: "Delhi",
    city: "New Delhi",
    active: true,
  },
  {
    id: "crt_2",
    name: "High Court for the State of Telangana",
    level: "High Court",
    state: "Telangana",
    city: "Hyderabad",
    active: true,
  },
  {
    id: "crt_3",
    name: "High Court of Andhra Pradesh",
    level: "High Court",
    state: "Andhra Pradesh",
    city: "Amaravati",
    active: true,
  },
  {
    id: "crt_4",
    name: "High Court of Karnataka",
    level: "High Court",
    state: "Karnataka",
    city: "Bengaluru",
    active: true,
  },
  {
    id: "crt_5",
    name: "Bombay High Court",
    level: "High Court",
    state: "Maharashtra",
    city: "Mumbai",
    active: true,
  },
  {
    id: "crt_6",
    name: "Delhi High Court",
    level: "High Court",
    state: "Delhi",
    city: "New Delhi",
    active: true,
  },
  {
    id: "crt_7",
    name: "Madras High Court",
    level: "High Court",
    state: "Tamil Nadu",
    city: "Chennai",
    active: true,
  },
  {
    id: "crt_8",
    name: "Calcutta High Court",
    level: "High Court",
    state: "West Bengal",
    city: "Kolkata",
    active: true,
  },
  {
    id: "crt_9",
    name: "City Civil and Sessions Court, Hyderabad",
    level: "District Court",
    state: "Telangana",
    city: "Hyderabad",
    active: true,
  },
  {
    id: "crt_10",
    name: "City Civil Court, Bengaluru",
    level: "District Court",
    state: "Karnataka",
    city: "Bengaluru",
    active: true,
  },
  {
    id: "crt_11",
    name: "National Company Law Tribunal (NCLT) Hyderabad",
    level: "Tribunal",
    state: "Telangana",
    city: "Hyderabad",
    active: true,
  },
  {
    id: "crt_12",
    name: "National Green Tribunal (NGT) Southern Zone",
    level: "Tribunal",
    state: "Tamil Nadu",
    city: "Chennai",
    active: true,
  },
  {
    id: "crt_13",
    name: "Central Administrative Tribunal (CAT) Hyderabad",
    level: "Tribunal",
    state: "Telangana",
    city: "Hyderabad",
    active: true,
  },
];

export const DEFAULT_STATES: StateItem[] = [
  { id: "st_1", name: "Andhra Pradesh", code: "AP", active: true },
  { id: "st_2", name: "Arunachal Pradesh", code: "AR", active: true },
  { id: "st_3", name: "Assam", code: "AS", active: true },
  { id: "st_4", name: "Bihar", code: "BR", active: true },
  { id: "st_5", name: "Chhattisgarh", code: "CG", active: true },
  { id: "st_6", name: "Goa", code: "GA", active: true },
  { id: "st_7", name: "Gujarat", code: "GJ", active: true },
  { id: "st_8", name: "Haryana", code: "HR", active: true },
  { id: "st_9", name: "Himachal Pradesh", code: "HP", active: true },
  { id: "st_10", name: "Jharkhand", code: "JH", active: true },
  { id: "st_11", name: "Karnataka", code: "KA", active: true },
  { id: "st_12", name: "Kerala", code: "KL", active: true },
  { id: "st_13", name: "Madhya Pradesh", code: "MP", active: true },
  { id: "st_14", name: "Maharashtra", code: "MH", active: true },
  { id: "st_15", name: "Manipur", code: "MN", active: true },
  { id: "st_16", name: "Meghalaya", code: "ML", active: true },
  { id: "st_17", name: "Mizoram", code: "MZ", active: true },
  { id: "st_18", name: "Nagaland", code: "NL", active: true },
  { id: "st_19", name: "Odisha", code: "OD", active: true },
  { id: "st_20", name: "Punjab", code: "PB", active: true },
  { id: "st_21", name: "Rajasthan", code: "RJ", active: true },
  { id: "st_22", name: "Sikkim", code: "SK", active: true },
  { id: "st_23", name: "Tamil Nadu", code: "TN", active: true },
  { id: "st_24", name: "Telangana", code: "TS", active: true },
  { id: "st_25", name: "Tripura", code: "TR", active: true },
  { id: "st_26", name: "Uttar Pradesh", code: "UP", active: true },
  { id: "st_27", name: "Uttarakhand", code: "UK", active: true },
  { id: "st_28", name: "West Bengal", code: "WB", active: true },
  { id: "st_29", name: "Andaman & Nicobar Islands", code: "AN", active: true },
  { id: "st_30", name: "Chandigarh", code: "CH", active: true },
  { id: "st_31", name: "Dadra & Nagar Haveli and Daman & Diu", code: "DN", active: true },
  { id: "st_32", name: "Delhi", code: "DL", active: true },
  { id: "st_33", name: "Jammu & Kashmir", code: "JK", active: true },
  { id: "st_34", name: "Ladakh", code: "LA", active: true },
  { id: "st_35", name: "Lakshadweep", code: "LD", active: true },
  { id: "st_36", name: "Puducherry", code: "PY", active: true },
];

export const DEFAULT_COURT_LEVELS: CourtLevelItem[] = [
  { id: "clv_1", name: "Supreme Court", code: "SC", active: true },
  { id: "clv_2", name: "High Court", code: "HC", active: true },
  { id: "clv_3", name: "District Court", code: "DC", active: true },
  { id: "clv_4", name: "Tribunal", code: "TRB", active: true },
  { id: "clv_5", name: "Consumer Commission", code: "CDRC", active: true },
  { id: "clv_6", name: "Family Court", code: "FC", active: true },
  { id: "clv_7", name: "Labour Court", code: "LC", active: true },
];

// --- Case Categories CRUD ---

/** Normalize a stored `subCategories` value to the tier-2/tier-3 shape.
 * Tolerates the pre-v3 `string[]` form and stray malformed entries. */
function normalizeSubCategories(raw: unknown): CaseSubCategoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): CaseSubCategoryItem | null => {
      if (typeof entry === "string") {
        return entry.trim() ? { name: entry.trim(), services: [] } : null;
      }
      if (entry && typeof entry === "object") {
        const name = String((entry as { name?: unknown }).name ?? "").trim();
        if (!name) return null;
        const svc = (entry as { services?: unknown }).services;
        const services = Array.isArray(svc) ? svc.map((x) => String(x).trim()).filter(Boolean) : [];
        return { name, services };
      }
      return null;
    })
    .filter((x): x is CaseSubCategoryItem => x !== null);
}

export function getCaseCategories(): CaseCategoryItem[] {
  const loaded = load<CaseCategoryItem[]>(CASE_CATEGORIES_KEY, DEFAULT_CASE_CATEGORIES);
  let changed = false;
  const hydrated = loaded.map((cat) => {
    const normalized = normalizeSubCategories(cat.subCategories);

    // Back-fill an empty sub-category list from the matching default (covers
    // rows migrated from a shape that had no sub-categories).
    if (normalized.length === 0) {
      const match = DEFAULT_CASE_CATEGORIES.find(
        (d) => d.name.toLowerCase() === cat.name.toLowerCase() || d.code === cat.code,
      );
      if (match?.subCategories?.length) {
        changed = true;
        return { ...cat, subCategories: match.subCategories };
      }
    }

    // If a migrated sub-category lost its services, restore them from the
    // matching default sub-category by name.
    const defMatch = DEFAULT_CASE_CATEGORIES.find(
      (d) => d.name.toLowerCase() === cat.name.toLowerCase() || d.code === cat.code,
    );
    const withServices = normalized.map((sc) => {
      if (sc.services.length > 0) return sc;
      const defSc = defMatch?.subCategories?.find(
        (d) => d.name.toLowerCase() === sc.name.toLowerCase(),
      );
      if (defSc?.services.length) {
        changed = true;
        return { ...sc, services: [...defSc.services] };
      }
      return sc;
    });

    if (changed || JSON.stringify(withServices) !== JSON.stringify(cat.subCategories ?? [])) {
      changed = true;
      return { ...cat, subCategories: withServices };
    }
    return cat;
  });
  if (changed) {
    save(CASE_CATEGORIES_KEY, hydrated);
  }
  return hydrated;
}

/** Public "Find a Lawyer" taxonomy view, derived from the active managed
 * categories. Same shape the mega-menu / pickers have always consumed:
 * `{ category, case_types: [{ case_type, legal_services }] }`. */
export function getPracticeAreaTree(): {
  category: string;
  case_types: { case_type: string; legal_services: string[] }[];
}[] {
  return getCaseCategories()
    .filter((c) => c.active)
    .map((c) => ({
      category: c.name,
      case_types: normalizeSubCategories(c.subCategories).map((sc) => ({
        case_type: sc.name,
        legal_services: sc.services,
      })),
    }));
}

export function saveCaseCategory(
  item: Omit<CaseCategoryItem, "id"> & { id?: string },
): CaseCategoryItem {
  const current = getCaseCategories();
  const now = new Date().toISOString().slice(0, 10);
  let saved: CaseCategoryItem;

  if (item.id && current.some((c) => c.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as CaseCategoryItem;
    const next = current.map((c) => (c.id === item.id ? saved : c));
    save(CASE_CATEGORIES_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `cat_${Date.now()}`,
      updatedAt: now,
    } as CaseCategoryItem;
    save(CASE_CATEGORIES_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteCaseCategory(id: string): boolean {
  const current = getCaseCategories();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length !== current.length) {
    save(CASE_CATEGORIES_KEY, filtered);
    return true;
  }
  return false;
}

// --- Languages CRUD ---
export function getLanguages(): LanguageItem[] {
  return load<LanguageItem[]>(LANGUAGES_KEY, DEFAULT_LANGUAGES);
}

export function saveLanguage(item: Omit<LanguageItem, "id"> & { id?: string }): LanguageItem {
  const current = getLanguages();
  const now = new Date().toISOString().slice(0, 10);
  let saved: LanguageItem;

  if (item.id && current.some((l) => l.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as LanguageItem;
    const next = current.map((l) => (l.id === item.id ? saved : l));
    save(LANGUAGES_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `lang_${Date.now()}`,
      updatedAt: now,
    } as LanguageItem;
    save(LANGUAGES_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteLanguage(id: string): boolean {
  const current = getLanguages();
  const filtered = current.filter((l) => l.id !== id);
  if (filtered.length !== current.length) {
    save(LANGUAGES_KEY, filtered);
    return true;
  }
  return false;
}

// --- Cities CRUD ---
export function getCities(): CityItem[] {
  return load<CityItem[]>(CITIES_KEY, DEFAULT_CITIES);
}

export function saveCity(item: Omit<CityItem, "id"> & { id?: string }): CityItem {
  const current = getCities();
  const now = new Date().toISOString().slice(0, 10);
  let saved: CityItem;

  if (item.id && current.some((c) => c.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as CityItem;
    const next = current.map((c) => (c.id === item.id ? saved : c));
    save(CITIES_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `city_${Date.now()}`,
      updatedAt: now,
    } as CityItem;
    save(CITIES_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteCity(id: string): boolean {
  const current = getCities();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length !== current.length) {
    save(CITIES_KEY, filtered);
    return true;
  }
  return false;
}

// --- Courts CRUD ---
export function getCourts(): CourtItem[] {
  return load<CourtItem[]>(COURTS_KEY, DEFAULT_COURTS);
}

export function saveCourt(item: Omit<CourtItem, "id"> & { id?: string }): CourtItem {
  const current = getCourts();
  const now = new Date().toISOString().slice(0, 10);
  let saved: CourtItem;

  if (item.id && current.some((c) => c.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as CourtItem;
    const next = current.map((c) => (c.id === item.id ? saved : c));
    save(COURTS_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `crt_${Date.now()}`,
      updatedAt: now,
    } as CourtItem;
    save(COURTS_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteCourt(id: string): boolean {
  const current = getCourts();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length !== current.length) {
    save(COURTS_KEY, filtered);
    return true;
  }
  return false;
}

// --- States CRUD ---
export function getStates(): StateItem[] {
  return load<StateItem[]>(STATES_KEY, DEFAULT_STATES);
}

export function saveState(item: Omit<StateItem, "id"> & { id?: string }): StateItem {
  const current = getStates();
  const now = new Date().toISOString().slice(0, 10);
  let saved: StateItem;

  if (item.id && current.some((s) => s.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as StateItem;
    const next = current.map((s) => (s.id === item.id ? saved : s));
    save(STATES_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `st_${Date.now()}`,
      updatedAt: now,
    } as StateItem;
    save(STATES_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteState(id: string): boolean {
  const current = getStates();
  const filtered = current.filter((s) => s.id !== id);
  if (filtered.length !== current.length) {
    save(STATES_KEY, filtered);
    return true;
  }
  return false;
}

// --- Court Levels CRUD ---
export function getCourtLevels(): CourtLevelItem[] {
  return load<CourtLevelItem[]>(COURT_LEVELS_KEY, DEFAULT_COURT_LEVELS);
}

export function saveCourtLevel(item: Omit<CourtLevelItem, "id"> & { id?: string }): CourtLevelItem {
  const current = getCourtLevels();
  const now = new Date().toISOString().slice(0, 10);
  let saved: CourtLevelItem;

  if (item.id && current.some((l) => l.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as CourtLevelItem;
    const next = current.map((l) => (l.id === item.id ? saved : l));
    save(COURT_LEVELS_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `clv_${Date.now()}`,
      updatedAt: now,
    } as CourtLevelItem;
    save(COURT_LEVELS_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteCourtLevel(id: string): boolean {
  const current = getCourtLevels();
  const filtered = current.filter((l) => l.id !== id);
  if (filtered.length !== current.length) {
    save(COURT_LEVELS_KEY, filtered);
    return true;
  }
  return false;
}

export function resetDataManagementToDefaults() {
  save(CASE_CATEGORIES_KEY, DEFAULT_CASE_CATEGORIES);
  save(LANGUAGES_KEY, DEFAULT_LANGUAGES);
  save(CITIES_KEY, DEFAULT_CITIES);
  save(COURTS_KEY, DEFAULT_COURTS);
  save(STATES_KEY, DEFAULT_STATES);
  save(COURT_LEVELS_KEY, DEFAULT_COURT_LEVELS);
}
