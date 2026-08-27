export type UserRole = "citizen" | "lawyer" | "admin";

export type CaseStatus =
  | "Pending"
  | "Submitted"
  | "Assigned"
  | "Rejected"
  | "Under Review"
  | "In Progress"
  | "Awaiting Documents"
  | "Resolved"
  | "Closed";

export type LegalCategory =
  | "Criminal"
  | "Civil"
  | "Property"
  | "Family"
  | "Consumer"
  | "Cyber"
  | "Corporate"
  | "Labour"
  | "Tax"
  | "Environmental";

export interface Citizen {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joinedAt: string;
  lastLoginAt: string;
  status: "Active" | "Inactive";
}

export interface LawyerPracticeArea {
  name: string;
  /** Self-reported proficiency, 0–100. */
  proficiency: number;
}

export interface LawyerAward {
  title: string;
  year: string;
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: LegalCategory;
  city: string;
  /** Neighbourhood/locality within `city` (e.g. "Gachibowli"), used to narrow
   * down the "Find a Lawyer" browse list once a city is picked. */
  area?: string;
  /** ISO date (YYYY-MM-DD) the Lawyer's account was registered. */
  joinedAt: string;
  barId: string;
  experienceYears: number;
  rating: number;
  status: "Pending" | "Approved" | "Rejected" | "Suspended";
  activeCases: number;
  photoUrl?: string;
  /** Data URL of the uploaded ID proof document, captured at registration. */
  idProofUrl?: string;
  idProofFileName?: string;
  officeAddress?: string;
  bio?: string;
  languages?: string[];
  practiceAreas?: LawyerPracticeArea[];
  specializations?: string[];
  courts?: string[];
  awards?: LawyerAward[];
  ratingCount?: number;
}

export interface CaseDocument {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  /** Data URL of the actual uploaded file, when a real file was captured. */
  fileDataUrl?: string;
  fileMimeType?: string;
  uploadedBy?: "citizen" | "lawyer";
}

export interface TimelineEvent {
  id: string;
  status: CaseStatus;
  at: string;
  note?: string;
}

export interface Hearing {
  id: string;
  date: string;
  time?: string;
  courtOrVenue?: string;
  note?: string;
  createdAt: string;
  judges?: string[];
  courtRoom?: string;
  itemNo?: string;
  hearingType?: string;
  businessDetails?: string;
  Lawyer?: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface LegalCase {
  id: string;
  title: string;
  description: string;
  category: LegalCategory;
  citizenId?: string;
  citizenName: string;
  lawyerId?: string;
  lawyerName?: string;
  status: CaseStatus;
  city: string;
  createdAt: string;
  updatedAt: string;
  documents: CaseDocument[];
  timeline: TimelineEvent[];
  hearings: Hearing[];
  caseNumber?: string;
  cnrNumber?: string;
  courtName?: string;
  stage?: string;
  filingDate?: string;
  fileNo?: string;
  petitioners?: string[];
  respondents?: string[];
  petitionerLawyers?: string[];
  respondentLawyers?: string[];
  source?: "manual" | "ecourt";
  isEmergency?: boolean;
  emergencyReason?: string;
}

export interface AIReport {
  caseId: string;
  summary: string;
  relevantActs: string[];
  applicableSections: { section: string; description: string }[];
  arguments: string[];
  counterArguments: string[];
  recommendations: string[];
  confidenceScore: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  role?: UserRole | "all";
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: "Act" | "Rule" | "Regulation" | "Amendment" | "Judgement" | "Order";
  category: LegalCategory;
  uploadedAt: string;
  size: string;
  /** Data URL of the actual uploaded file, when a real file was selected on upload. */
  fileDataUrl?: string;
  fileName?: string;
  fileMimeType?: string;
}

/** A Lawyer's own personal reference document — separate from the admin-
 * curated, shared `KnowledgeItem` index ("Global Docs"). */
export interface LawyerDocument {
  id: string;
  lawyerId: string;
  title: string;
  uploadedAt: string;
  size: string;
  fileDataUrl?: string;
  fileName?: string;
  fileMimeType?: string;
}
