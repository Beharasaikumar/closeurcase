import type {
  AIReport,
  AppNotification,
  CaseDocument,
  CaseNote,
  CaseStatus,
  Citizen,
  Hearing,
  KnowledgeItem,
  Lawyer,
  LawyerDocument,
  LegalCase,
  Subscription,
  UserRole,
} from "@/types";
import {
  categories as seedCategories,
  citizens as seedCitizens,
  lawyers as seedLawyers,
  cases as seedCases,
  subscriptions as seedSubscriptions,
  notifications as seedNotifications,
  knowledgeBase as seedKnowledgeBase,
} from "./mock";

const LAWYERS_KEY = "cuc_lawyers_v7";
const CITIZENS_KEY = "cuc_citizens_v3";
const NOTIFICATIONS_KEY = "cuc_notifications_v2";
const KB_KEY = "cuc_kb_v3";
const LAWYER_DOCS_KEY = "cuc_lawyer_docs_v1";
const PROFILE_PHOTOS_KEY = "cuc_profile_photos_v1";
const CASES_KEY = "cuc_cases_v7";
const NOTES_KEY = "cuc_case_notes_v1";
const SUBSCRIPTIONS_KEY = "cuc_subscriptions_v1";

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
export function getCases(): LegalCase[] {
  const cases = load<LegalCase[]>(CASES_KEY, seedCases);
  const existingIds = new Set(cases.map((c) => c.id));
  const missingSeedEmergency = seedCases.filter((sc) => sc.isEmergency && !existingIds.has(sc.id));
  if (missingSeedEmergency.length > 0) {
    const merged = [...missingSeedEmergency, ...cases];
    save(CASES_KEY, merged);
    return merged.map((c) => (c.hearings ? c : { ...c, hearings: [] }));
  }
  return cases.map((c) => (c.hearings ? c : { ...c, hearings: [] }));
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
  const today = new Date().toISOString().slice(0, 10);

  const updated = current.map((c) => {
    if (c.id !== id) return c;
    const timeline = c.timeline || [];
    const newTimeline = [
      ...timeline,
      {
        id: `t_${Date.now()}`,
        status: newStatus,
        at: today,
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
  const today = new Date().toISOString().slice(0, 10);

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
      { id: `t_${Date.now()}`, status: newStatus, at: today, note },
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
    c.id === caseId ? { ...c, documents: [...c.documents, ...docs], updatedAt: today } : c,
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

/* ── HEARINGS (per-case) ─────────────────────────────────────────────────── */
export function addHearing(caseId: string, hearing: Omit<Hearing, "id" | "createdAt">) {
  const current = getCases();
  const today = new Date().toISOString().slice(0, 10);
  const newHearing: Hearing = { ...hearing, id: `h_${Date.now()}`, createdAt: today };

  const updated = current.map((c) =>
    c.id === caseId ? { ...c, hearings: [...c.hearings, newHearing] } : c,
  );
  saveCases(updated);

  const found = updated.find((c) => c.id === caseId);
  if (found) {
    addNotification({
      title: "Hearing Scheduled",
      body: `A hearing for case ${caseId} (${found.title}) has been scheduled on ${hearing.date}${hearing.time ? ` at ${hearing.time}` : ""}.`,
    });
  }
}

export function updateHearing(
  caseId: string,
  hearingId: string,
  patch: Partial<Omit<Hearing, "id" | "createdAt">>,
) {
  const current = getCases();
  const updated = current.map((c) => {
    if (c.id !== caseId) return c;
    return {
      ...c,
      hearings: c.hearings.map((h) => (h.id === hearingId ? { ...h, ...patch } : h)),
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

export function deleteHearing(caseId: string, hearingId: string) {
  const current = getCases();
  const updated = current.map((c) =>
    c.id === caseId ? { ...c, hearings: c.hearings.filter((h) => h.id !== hearingId) } : c,
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
