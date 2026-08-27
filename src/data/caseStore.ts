/**
 * Simple localStorage-backed store for cases submitted through the
 * "Find a Lawyer" wizard.  All reads/writes go through this module so
 * citizen.index, citizen.my-cases, and citizen.create-case stay in sync
 * without a backend.
 */
import type { LegalCase, CaseStatus } from "@/types";

const KEY = "cuc_submitted_cases";

function load(): LegalCase[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LegalCase[]) : [];
  } catch {
    return [];
  }
}

function save(cases: LegalCase[]) {
  localStorage.setItem(KEY, JSON.stringify(cases));
}

export function getSubmittedCases(): LegalCase[] {
  // Backfill `hearings` for cases persisted in localStorage before that field existed.
  return load().map((c) => (c.hearings ? c : { ...c, hearings: [] }));
}

export function addSubmittedCase(c: LegalCase) {
  const existing = load();
  save([c, ...existing]);
}

export function buildCase(params: {
  title: string;
  description: string;
  category: string;
  lawyerName?: string;
  lawyerId?: string;
  location: string;
  documents: { name: string; size: string }[];
}): LegalCase {
  const id = `CS-${Math.floor(10000 + Math.random() * 90000)}`;
  const today = new Date().toISOString().split("T")[0];
  return {
    id,
    title: params.title || "Legal Matter",
    description: params.description || "",
    // @ts-expect-error — category is a string from form, compatible at runtime
    category: params.category,
    citizenId: "u_001",
    citizenName: "Sai Teja Reddy",
    lawyerId: params.lawyerId,
    lawyerName: params.lawyerName,
    status: "Submitted" as CaseStatus,
    city: params.location,
    createdAt: today,
    updatedAt: today,
    documents: params.documents.map((d, i) => ({
      id: `d_new_${i}`,
      name: d.name,
      size: d.size,
      uploadedAt: today,
    })),
    timeline: [
      {
        id: "t1",
        status: "Submitted" as CaseStatus,
        at: today,
        note: "Case filed via Find a Lawyer",
      },
    ],
    hearings: [],
  };
}
