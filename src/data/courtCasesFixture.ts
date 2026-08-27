import type { CaseStatus, Hearing, LegalCase, LegalCategory } from "@/types";

export type ImportSearchMethod =
  "Party Name" | "Case Number" | "Diary Number" | "Lawyer Name" | "CNR Number";

export interface ImportableCourtCase {
  id: string;
  title: string;
  petitioners: string[];
  respondents: string[];
  petitionerLawyers: string[];
  respondentLawyers: string[];
  category: LegalCategory;
  courtName: string;
  caseType: string;
  caseNumber: string;
  caseYear: string;
  cnrNumber: string;
  diaryNumber: string;
  stage: string;
  filingDate: string;
  status: CaseStatus;
  city: string;
  description: string;
  hearings: Hearing[];
}

const bodhanHearings: Hearing[] = [
  {
    id: "ih1",
    date: "2026-08-12",
    time: "10:30 AM",
    courtOrVenue: "City Civil Court, Hyderabad",
    judges: ["V Additional District And Sessions Judge, Hyderabad"],
    hearingType: "Civil-dailylist",
    createdAt: "2026-07-01",
  },
  {
    id: "ih2",
    date: "2026-07-28",
    time: "10:30 AM",
    courtOrVenue: "City Civil Court, Hyderabad",
    judges: ["V Additional District And Sessions Judge, Hyderabad"],
    businessDetails: "Written statement filed by respondent; matter posted for evidence.",
    hearingType: "Civil-dailylist",
    createdAt: "2026-06-15",
  },
  {
    id: "ih3",
    date: "2026-07-15",
    time: "10:30 AM",
    courtOrVenue: "City Civil Court, Hyderabad",
    courtRoom: "1-SMT. D.VAROODHINI-V Additional District and Sessions Judge, Hyderabad",
    itemNo: "7",
    judges: ["V Additional District And Sessions Judge, Hyderabad", "Smt. D.Varoodhini"],
    businessDetails: "Parties present; adjourned for filing of written statement.",
    hearingType: "Civil-dailylist",
    createdAt: "2026-06-01",
  },
  {
    id: "ih4",
    date: "2026-03-18",
    time: "10:30 AM",
    courtOrVenue: "City Civil Court, Hyderabad",
    judges: ["V Additional District And Sessions Judge, Hyderabad"],
    hearingType: "Civil-dailylist",
    createdAt: "2026-03-01",
  },
  {
    id: "ih5",
    date: "2026-03-11",
    time: "10:30 AM",
    courtOrVenue: "City Civil Court, Hyderabad",
    judges: ["V Additional District And Sessions Judge, Hyderabad"],
    hearingType: "Civil-dailylist",
    createdAt: "2026-02-20",
  },
];

export const importableCourtCases: ImportableCourtCase[] = [
  {
    id: "ec_1",
    title:
      "Yadamakanti Laxmi Narayana Reddy vs Nizam Sugars LTD (Nsl) Represented by its Authorized Signatory Sri K Ramesh Babu",
    petitioners: ["Yadamakanti Laxmi Narayana Reddy"],
    respondents: [
      "Nizam Sugars LTD (Nsl) Represented by its Authorized Signatory Sri K Ramesh Babu",
    ],
    petitionerLawyers: ["testing account"],
    respondentLawyers: ["Not on record"],
    category: "Civil",
    courtName: "City Civil Court, Hyderabad",
    caseType: "OS",
    caseNumber: "OS/4/2025",
    caseYear: "2025",
    cnrNumber: "TSNI080001912025",
    diaryNumber: "DY/112/2025",
    stage: "WRITTEN STATEMENT",
    filingDate: "2025-12-10",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Original suit filed before the City Civil Court, Hyderabad concerning a civil dispute between Yadamakanti Laxmi Narayana Reddy and Nizam Sugars LTD (Nsl). Matter is currently at the written statement stage.",
    hearings: bodhanHearings,
  },
  {
    id: "ec_2",
    title: "Ramesh Kumar vs State Bank of Hyderabad",
    petitioners: ["Ramesh Kumar"],
    respondents: ["State Bank of Hyderabad"],
    petitionerLawyers: ["K. Srinivas"],
    respondentLawyers: ["Bank Legal Panel"],
    category: "Consumer",
    courtName: "District Consumer Disputes Redressal Commission, Visakhapatnam",
    caseType: "CC",
    caseNumber: "CC/17/2026",
    caseYear: "2026",
    cnrNumber: "APVK020001172026",
    diaryNumber: "DY/044/2026",
    stage: "ARGUMENTS",
    filingDate: "2026-01-20",
    status: "Pending",
    city: "Visakhapatnam",
    description:
      "Consumer complaint regarding a disputed loan foreclosure charge, pending before the District Consumer Disputes Redressal Commission, Visakhapatnam.",
    hearings: [
      {
        id: "ih6",
        date: "2026-08-20",
        time: "11:00 AM",
        courtOrVenue: "District Consumer Disputes Redressal Commission, Visakhapatnam",
        judges: ["President, DCDRC Visakhapatnam"],
        hearingType: "Consumer-dailylist",
        createdAt: "2026-07-10",
      },
    ],
  },
  {
    id: "ec_3",
    title: "Telangana State Pollution Control Board vs Vishwa Industries Pvt Ltd",
    petitioners: ["Telangana State Pollution Control Board"],
    respondents: ["Vishwa Industries Pvt Ltd"],
    petitionerLawyers: ["Govt. Pleader"],
    respondentLawyers: ["M. Aditya Rao"],
    category: "Environmental",
    courtName: "High Court for the State of Telangana",
    caseType: "WP",
    caseNumber: "WP/2211/2026",
    caseYear: "2026",
    cnrNumber: "TSHC010022112026",
    diaryNumber: "DY/501/2026",
    stage: "COUNTER FILED",
    filingDate: "2026-02-02",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Writ petition concerning compliance with effluent discharge norms, pending before the High Court for the State of Telangana.",
    hearings: [
      {
        id: "ih7",
        date: "2026-09-02",
        time: "10:00 AM",
        courtOrVenue: "High Court for the State of Telangana",
        judges: ["Hon'ble Justice Bench-II"],
        hearingType: "WP-dailylist",
        createdAt: "2026-07-25",
      },
    ],
  },
];

/** Fisher-Yates shuffle — used so a no-exact-match search doesn't always fall back to the same case. */
export function shuffleCourtCases(cases: ImportableCourtCase[]): ImportableCourtCase[] {
  const arr = [...cases];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function searchCourtCases(params: {
  method: ImportSearchMethod;
  courtName?: string;
  caseType?: string;
  caseNumber?: string;
  caseYear?: string;
  query?: string;
}): ImportableCourtCase[] {
  const { method, courtName, caseType, caseNumber, caseYear, query } = params;
  const q = (query ?? "").trim().toLowerCase();

  return importableCourtCases.filter((c) => {
    if (courtName && !c.courtName.toLowerCase().includes(courtName.trim().toLowerCase())) {
      return false;
    }

    switch (method) {
      case "Case Number": {
        const typeOk = !caseType || c.caseType.toLowerCase() === caseType.trim().toLowerCase();
        const numberOk =
          !caseNumber || c.caseNumber.toLowerCase().includes(caseNumber.trim().toLowerCase());
        const yearOk = !caseYear || c.caseYear === caseYear.trim();
        return typeOk && numberOk && yearOk;
      }
      case "Diary Number":
        return !q || c.diaryNumber.toLowerCase().includes(q);
      case "CNR Number":
        return !q || c.cnrNumber.toLowerCase().includes(q);
      case "Lawyer Name":
        return (
          !q ||
          c.petitionerLawyers.some((a) => a.toLowerCase().includes(q)) ||
          c.respondentLawyers.some((a) => a.toLowerCase().includes(q))
        );
      case "Party Name":
      default:
        return (
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.petitioners.some((p) => p.toLowerCase().includes(q)) ||
          c.respondents.some((r) => r.toLowerCase().includes(q))
        );
    }
  });
}

export function toLegalCase(
  source: ImportableCourtCase,
  lawyerId: string,
  lawyerName: string,
): LegalCase {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `CS-${Math.floor(10000 + Math.random() * 90000)}`,
    title: source.title,
    description: source.description,
    category: source.category,
    citizenId: undefined,
    citizenName: source.petitioners[0] ?? "Unlinked Client",
    lawyerId,
    lawyerName,
    status: source.status,
    city: source.city,
    createdAt: today,
    updatedAt: today,
    documents: [],
    timeline: [
      {
        id: "t1",
        status: source.status,
        at: today,
        note: `Imported from eCourts (${source.cnrNumber})`,
      },
    ],
    hearings: source.hearings,
    caseNumber: source.caseNumber,
    cnrNumber: source.cnrNumber,
    courtName: source.courtName,
    stage: source.stage,
    filingDate: source.filingDate,
    petitioners: source.petitioners,
    respondents: source.respondents,
    petitionerLawyers: source.petitionerLawyers,
    respondentLawyers: source.respondentLawyers,
    source: "ecourt",
  };
}
