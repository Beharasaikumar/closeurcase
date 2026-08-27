import type {
  AIReport,
  AppNotification,
  Citizen,
  KnowledgeItem,
  Lawyer,
  LegalCase,
  LegalCategory,
} from "@/types";

export const categories: LegalCategory[] = [
  "Criminal",
  "Civil",
  "Property",
  "Family",
  "Consumer",
  "Cyber",
  "Corporate",
  "Labour",
  "Tax",
  "Environmental",
];

export const citizens: Citizen[] = [
  {
    id: "u_001",
    name: "Sai Teja Reddy",
    email: "saiteja.reddy@example.com",
    phone: "+91 98110 22111",
    city: "Hyderabad",
    joinedAt: "2025-02-14",
    lastLoginAt: "2026-09-13T09:15:00",
    status: "Active",
  },
  {
    id: "u_002",
    name: "Lakshmi Prasanna",
    email: "lakshmi.prasanna@example.com",
    phone: "+91 98320 45123",
    city: "Visakhapatnam",
    joinedAt: "2025-04-01",
    lastLoginAt: "2026-08-11T18:42:00",
    status: "Active",
  },
  {
    id: "u_003",
    name: "Divya Sri Chowdary",
    email: "divya.chowdary@example.com",
    phone: "+91 98450 88321",
    city: "Hyderabad",
    joinedAt: "2025-04-11",
    lastLoginAt: "2026-08-05T11:20:00",
    status: "Active",
  },
  {
    id: "u_004",
    name: "Venkata Ramana Naidu",
    email: "ramana.naidu@example.com",
    phone: "+91 98333 11902",
    city: "Visakhapatnam",
    joinedAt: "2026-08-10",
    lastLoginAt: "2026-07-20T08:05:00",
    status: "Inactive",
  },
  {
    id: "u_005",
    name: "Padmavathi Rao",
    email: "padmavathi.rao@example.com",
    phone: "+91 98771 55220",
    city: "Hyderabad",
    joinedAt: "2026-08-13",
    lastLoginAt: "2026-08-12T21:03:00",
    status: "Active",
  },
];

export const lawyers: Lawyer[] = [
  {
    id: "l_001",
    name: "Swathi Reddy",
    email: "swathi.reddy@closeur.legal",
    phone: "+91 98100 12345",
    category: "Criminal",
    city: "Hyderabad",
    area: "Nampally",
    joinedAt: "2025-01-12",
    barId: "TS/2014/1023",
    experienceYears: 11,
    rating: 4.8,
    status: "Approved",
    activeCases: 6,
    officeAddress: "Chamber No. 214, Telangana High Court Complex, Nampally, Hyderabad",
    bio: "Swathi has spent over a decade defending clients across Telangana's criminal courts, with a focus on bail applications, anti-corruption matters, and POCSO cases. She believes in swift, transparent communication with every client she represents.",
    languages: ["English", "Telugu", "Hindi"],
    practiceAreas: [
      { name: "Criminal Defense", proficiency: 92 },
      { name: "Anticipatory Bail", proficiency: 85 },
      { name: "Anti-Corruption", proficiency: 70 },
    ],
    specializations: [
      "Criminal Litigation",
      "Anticipatory Bail",
      "POCSO Act",
      "Fraud Cases",
      "Cheque Bounce",
    ],
    courts: ["Telangana High Court", "District Court Nampally", "City Civil Court Hyderabad"],
    awards: [{ title: "Client's Choice Lawyer", year: "2025" }],
    ratingCount: 120,
  },
  {
    id: "l_002",
    name: "Srinivas Chowdary",
    email: "srinivas.chowdary@closeur.legal",
    phone: "+91 98100 23456",
    category: "Property",
    city: "Hyderabad",
    area: "Somajiguda",
    joinedAt: "2025-02-20",
    barId: "TS/2011/0812",
    experienceYears: 14,
    rating: 4.6,
    status: "Approved",
    activeCases: 4,
    officeAddress: "Plot 45, Somajiguda, Hyderabad",
    bio: "Srinivas is a property law specialist who has handled land disputes, partition suits, and illegal construction cases across Hyderabad for over 14 years. He is known for his meticulous documentation review.",
    languages: ["English", "Telugu"],
    practiceAreas: [
      { name: "Property Disputes", proficiency: 90 },
      { name: "Partition Suits", proficiency: 80 },
      { name: "Real Estate (RERA)", proficiency: 65 },
    ],
    specializations: [
      "Land Disputes",
      "Illegal Construction",
      "Property Partition",
      "Title Verification",
      "Municipal Corporation Issues",
    ],
    courts: ["Telangana High Court", "District Court Rangareddy", "City Civil Court Hyderabad"],
    ratingCount: 95,
  },
  {
    id: "l_003",
    name: "Sailaja Naidu",
    email: "sailaja.naidu@closeur.legal",
    phone: "+91 98100 34567",
    category: "Family",
    city: "Visakhapatnam",
    area: "MVP Colony",
    joinedAt: "2026-08-09",
    barId: "AP/2017/2210",
    experienceYears: 8,
    rating: 4.9,
    status: "Pending",
    activeCases: 0,
    officeAddress: "MVP Colony, Visakhapatnam",
    bio: "Sailaja practices family law with an emphasis on divorce, child custody, and maintenance cases. She approaches every case with empathy while pursuing the best possible outcome for her clients.",
    languages: ["English", "Telugu"],
    practiceAreas: [
      { name: "Family Law", proficiency: 88 },
      { name: "Divorce & Custody", proficiency: 90 },
      { name: "Maintenance & Alimony", proficiency: 75 },
    ],
    specializations: [
      "Divorce",
      "Child Custody",
      "Domestic Violence",
      "Family Property Dispute",
      "Wills & Trusts",
    ],
    courts: [
      "Andhra Pradesh High Court",
      "Family Court Visakhapatnam",
      "District Court Visakhapatnam",
    ],
    awards: [{ title: "Rising Star in Family Law", year: "2024" }],
    ratingCount: 60,
  },
  {
    id: "l_004",
    name: "Venkatesh Rao",
    email: "venkatesh.rao@closeur.legal",
    phone: "+91 98100 45678",
    category: "Corporate",
    city: "Hyderabad",
    area: "Gachibowli",
    joinedAt: "2025-03-15",
    barId: "TS/2012/0091",
    experienceYears: 13,
    rating: 4.5,
    status: "Approved",
    activeCases: 9,
    officeAddress: "Level 4, Cyber Towers, Gachibowli, Hyderabad",
    bio: "Venkatesh advises startups and mid-sized companies on incorporation, contracts, and compliance. His corporate practice spans arbitration, NCLT matters, and commercial dispute resolution.",
    languages: ["English", "Telugu", "Hindi"],
    practiceAreas: [
      { name: "Corporate Law", proficiency: 85 },
      { name: "Arbitration & Mediation", proficiency: 78 },
      { name: "NCLT Matters", proficiency: 70 },
    ],
    specializations: [
      "Contract Drafting & Review",
      "Company Incorporation",
      "Arbitration",
      "Mergers & Acquisitions",
      "Compliance",
    ],
    courts: ["Telangana High Court", "NCLT Hyderabad Bench", "City Civil Court Hyderabad"],
    awards: [{ title: "Top Corporate Counsel", year: "2025" }],
    ratingCount: 140,
  },
  {
    id: "l_005",
    name: "Haritha Sarma",
    email: "haritha.sarma@closeur.legal",
    phone: "+91 98100 56789",
    category: "Cyber",
    city: "Visakhapatnam",
    area: "Dwaraka Nagar",
    joinedAt: "2026-08-12",
    barId: "AP/2019/3320",
    experienceYears: 6,
    rating: 4.7,
    status: "Pending",
    activeCases: 0,
    officeAddress: "Dwaraka Nagar, Visakhapatnam",
    bio: "Haritha focuses on cyber law, handling online fraud, data privacy, and social media harassment cases. She works closely with law enforcement's cyber cells to build strong digital evidence trails.",
    languages: ["English", "Telugu"],
    practiceAreas: [
      { name: "Cyber Law", proficiency: 82 },
      { name: "Data Privacy", proficiency: 68 },
      { name: "Fraud & Financial Crime", proficiency: 75 },
    ],
    specializations: [
      "Online Fraud",
      "UPI / Banking Fraud",
      "Data Privacy",
      "Cyberbullying",
      "IT Act Cases",
    ],
    courts: [
      "Andhra Pradesh High Court",
      "District Court Visakhapatnam",
      "Cyber Crime Cell Visakhapatnam",
    ],
    ratingCount: 40,
  },
  {
    id: "l_006",
    name: "Krishna Murthy",
    email: "krishna.murthy@closeur.legal",
    phone: "+91 98100 67890",
    category: "Labour",
    city: "Visakhapatnam",
    area: "Gajuwaka",
    joinedAt: "2026-08-14",
    barId: "AP/2010/0442",
    experienceYears: 15,
    rating: 4.4,
    status: "Suspended",
    activeCases: 0,
    officeAddress: "Gajuwaka, Visakhapatnam",
    bio: "Krishna has represented both employees and employers in labour disputes for 15 years, covering wrongful termination, wage recovery, and industrial tribunal matters.",
    languages: ["English", "Telugu"],
    practiceAreas: [
      { name: "Labour & Employment", proficiency: 80 },
      { name: "Industrial Disputes", proficiency: 72 },
    ],
    specializations: [
      "Wrongful Termination",
      "Wage Recovery",
      "Provident Fund Disputes",
      "Industrial Tribunal",
    ],
    courts: [
      "Andhra Pradesh High Court",
      "Labour Court Visakhapatnam",
      "Industrial Tribunal Visakhapatnam",
    ],
    ratingCount: 55,
  },
];

export const cases: LegalCase[] = [
  {
    id: "CS-91101",
    title: "Urgent Bail Application — Detention at Cyberabad Police Station",
    description:
      "Emergency bail filing required within 24 hours due to procedural non-compliance during midnight arrest at Gachibowli.",
    category: "Criminal",
    citizenId: "u_003",
    citizenName: "Ananya Sharma",
    status: "Submitted",
    city: "Hyderabad",
    createdAt: "2026-08-13",
    updatedAt: "2026-08-13",
    isEmergency: true,
    emergencyReason:
      "Immediate bail petition filing required within 24 hrs — Custodial hearing scheduled",
    documents: [],
    timeline: [
      {
        id: "t_em1",
        status: "Submitted",
        at: "2026-08-13",
        note: "Emergency case created by citizen",
      },
    ],
    hearings: [],
  },
  {
    id: "CS-91102",
    title: "Ex-parte Injunction — Imminent Illegal Property Demolition",
    description:
      "Urgent stay order required from High Court before municipal demolition crew executes notice issued without mandatory 15-day cure window.",
    category: "Property",
    citizenId: "u_002",
    citizenName: "Lakshmi Prasanna",
    status: "Submitted",
    city: "Visakhapatnam",
    createdAt: "2026-08-13",
    updatedAt: "2026-08-13",
    isEmergency: true,
    emergencyReason: "Stay order required before municipal 8:00 AM demolition deadline",
    documents: [],
    timeline: [
      {
        id: "t_em2",
        status: "Submitted",
        at: "2026-08-13",
        note: "Emergency case created by citizen",
      },
    ],
    hearings: [],
  },
  {
    id: "CS-34253",
    title: "Property boundary dispute — Banjara Hills",
    description: `STATEMENT OF FACTS & LEGAL BREIF:

1. The applicant Sai Teja Reddy is the absolute registered owner of Plot No. 44, Road No. 12, Banjara Hills, Hyderabad, acquired via registered Sale Deed dated 14th March 2018 (Document No. 4012/2018).

2. In August 2025, the adjacent plot owner (Plot No. 45) commenced unauthorized construction of a reinforced concrete boundary wall. A formal municipal survey conducted by the Greater Hyderabad Municipal Corporation (GHMC) on 20th September 2025 verified that the construction encroaches approximately 2.4 feet into Plot No. 44 over a length of 48 feet, violating approved layout dimensions.

3. Statutory legal notices served under Section 80 CPC and Section 452 of the Telangana Municipalities Act, 2019 were met with non-compliance. Relief is sought for permanent injunction restraining further construction, demolition of the encroaching structure, and restoration of registered boundaries.`,
    category: "Property",
    citizenId: "u_001",
    citizenName: "Sai Teja Reddy",
    lawyerId: "l_001",
    lawyerName: "Swathi Reddy",
    status: "In Progress",
    city: "Hyderabad",
    createdAt: "2025-09-14",
    updatedAt: "2025-11-02",
    documents: [
      {
        id: "d1",
        name: "CS-34253_Registered_Sale_Deed.pdf",
        size: "1.4 MB",
        uploadedAt: "2025-09-14",
      },
      {
        id: "d2",
        name: "CS-34253_GHMC_Municipal_Survey_Report.pdf",
        size: "820 KB",
        uploadedAt: "2025-09-20",
      },
    ],
    timeline: [
      { id: "t1", status: "Submitted", at: "2025-09-14" },
      { id: "t2", status: "Assigned", at: "2025-09-16", note: "Assigned to Swathi Reddy" },
      { id: "t3", status: "Under Review", at: "2025-09-22" },
      { id: "t4", status: "In Progress", at: "2025-10-05" },
    ],
    hearings: [
      {
        id: "h1",
        date: "2025-10-15",
        time: "11:00 AM",
        courtOrVenue: "City Civil Court, Banjara Hills, Hyderabad",
        note: "First hearing — boundary survey report presented",
        createdAt: "2025-10-01",
        judges: ["II Additional Chief Judge, City Civil Court, Hyderabad"],
        hearingType: "Civil-dailylist",
      },
      {
        id: "h2",
        date: "2026-09-05",
        time: "10:30 AM",
        courtOrVenue: "City Civil Court, Banjara Hills, Hyderabad",
        note: "Next hearing — municipal survey cross-examination",
        createdAt: "2025-11-02",
        judges: ["II Additional Chief Judge, City Civil Court, Hyderabad"],
        courtRoom: "3-II Additional Chief Judge, City Civil Court, Hyderabad",
        itemNo: "12",
        hearingType: "Civil-dailylist",
      },
    ],
    caseNumber: "OS/112/2025",
    cnrNumber: "TSHC010011342025",
    courtName: "City Civil Court, Banjara Hills, Hyderabad",
    stage: "EVIDENCE",
    filingDate: "2025-09-14",
    petitioners: ["Sai Teja Reddy"],
    respondents: ["Owner, Plot No. 45, Banjara Hills"],
    petitionerLawyers: ["Swathi Reddy"],
    respondentLawyers: ["Not on record"],
    source: "manual",
  },
  {
    id: "CS-61847",
    title: "Consumer complaint — defective appliance & breach of warranty",
    description: `STATEMENT OF COMPLAINT & INJURY DETAILS:

1. The complainant Lakshmi Prasanna purchased a premium smart refrigerator (Model: UltraCool Pro 550L) from Authorized Distributor ElectroWorld, Dwaraka Nagar, Visakhapatnam on 12th July 2025 for ₹74,999 under invoice number EW-2025-8891.

2. Within 45 days of installation, the compressor unit suffered total failure resulting in loss of perishable household goods. Despite three official service requests (SR-9012, SR-9411, SR-9902), the technical team failed to rectify the defect. On 2nd November 2025, a second major cooling failure rendered the appliance unusable.

3. The manufacturer and distributor have rejected repeated requests for replacement or full refund under statutory warranty clauses. A formal complaint has been prepared for filing before the Visakhapatnam District Consumer Disputes Redressal Commission seeking full refund, compensation for spoiled goods (₹18,500), and litigation costs under Consumer Protection Act, 2019.`,
    category: "Consumer",
    citizenId: "u_002",
    citizenName: "Lakshmi Prasanna",
    lawyerId: "l_001",
    lawyerName: "Swathi Reddy",
    status: "Submitted",
    city: "Visakhapatnam",
    createdAt: "2025-11-10",
    updatedAt: "2025-11-10",
    documents: [],
    timeline: [{ id: "t1", status: "Submitted", at: "2025-11-10" }],
    hearings: [],
  },
  {
    id: "CS-78902",
    title: "Cyber fraud — unauthorized UPI phishing transaction",
    description: `INCIDENT REPORT & EVIDENTIARY BRIEF:

1. On 22nd October 2025 at 14:15 IST, the victim Divya Sri Chowdary received an SMS notification impersonating Nationalized Bank Customer Portal requesting urgent KYC update via link (http://secure-kyc-verify-bank.com).

2. Upon accessing the link, a malicious overlay captured authentication tokens, resulting in unauthorized debit of ₹84,000 across three immediate IMPS transactions into account number 9901-XXXX-4412 located in a foreign jurisdiction.

3. Immediate cyber crime helpline reporting (Cyber Crime Incident No. 2025-HYD-88910) was logged with the Cyberabad Cyber Crime Police Station within the 2-hour 'golden period'. Written representation served upon the bank under RBI Guidelines on Customer Liability in Unauthorized Electronic Banking Transactions (2017) seeking zero liability reversal.`,
    category: "Cyber",
    citizenId: "u_003",
    citizenName: "Divya Sri Chowdary",
    lawyerId: "l_001",
    lawyerName: "Swathi Reddy",
    status: "Awaiting Documents",
    city: "Hyderabad",
    createdAt: "2025-10-22",
    updatedAt: "2025-11-14",
    documents: [
      {
        id: "d4",
        name: "CS-78902_Bank_Transaction_Statement.pdf",
        size: "620 KB",
        uploadedAt: "2025-10-22",
      },
    ],
    timeline: [
      { id: "t1", status: "Submitted", at: "2025-10-22" },
      { id: "t2", status: "Assigned", at: "2025-10-24" },
      { id: "t3", status: "Under Review", at: "2025-10-30" },
      { id: "t4", status: "Awaiting Documents", at: "2025-11-14", note: "FIR copy requested" },
    ],
    hearings: [],
  },
  {
    id: "CS-45119",
    title: "Family matter — mutual consent divorce petition",
    description: `PETITION FOR DISSOLUTION OF MARRIAGE BY MUTUAL CONSENT UNDER SECTION 13-B OF THE HINDU MARRIAGE ACT, 1955:

1. The Petitioner No. 1 Padmavathi Rao and Petitioner No. 2 were lawfully married on 18th May 2021 as per traditional Hindu rites and ceremonies at Somajiguda, Hyderabad. The marriage was duly registered with the Registrar of Marriages under Registration No. HYD-2021-8841.

2. Due to fundamental differences in temperament, lifestyle preferences, and irreconcilable personal disputes, cohabitation between the parties ceased on 10th January 2024. The parties have lived continuously separate and apart for a period exceeding one year preceding the date of this petition, without any cohabitation or marital relations.

3. All efforts for reconciliation mediated by family elders and community counselors have failed, and both parties have mutually and independently concluded that the marriage has broken down irretrievably.

4. A comprehensive Memorandum of Understanding & Settlement Agreement dated 1st June 2025 has been duly executed between the parties settling all ancillary matters:
   a) Permanent Alimony & Maintenance: Petitioner No. 2 has transferred a one-time full & final settlement sum of ₹25,00,000 to Petitioner No. 1's bank account, and Petitioner No. 1 has relinquished all future claims for maintenance.
   b) Moveable Assets & Gold Ornaments: All gold jewelry, streedhan items, personal effects, and vehicles have been mutually divided and acknowledged in writing.
   c) Joint Financial Accounts: Joint bank accounts and credit liabilities have been severed without any outstanding claims against each other.

5. It is humbly prayed that this Hon'ble Family Court at Nampally, Hyderabad be pleased to:
   i) Pass a decree of divorce dissolving the marriage between Petitioner No. 1 and Petitioner No. 2 under Section 13-B of the Hindu Marriage Act, 1955.
   ii) Waive the 6-month statutory waiting period (cooling-off period) for Second Motion in accordance with Supreme Court directions in Amardeep Singh v. Harveen Kaur (2017 8 SCC 746).`,
    category: "Family",
    citizenId: "u_005",
    citizenName: "Padmavathi Rao",
    lawyerId: "l_004",
    lawyerName: "Venkatesh Rao",
    status: "Resolved",
    city: "Hyderabad",
    createdAt: "2025-06-11",
    updatedAt: "2025-10-01",
    documents: [],
    timeline: [
      { id: "t1", status: "Submitted", at: "2025-06-11" },
      { id: "t2", status: "Assigned", at: "2025-06-13" },
      { id: "t3", status: "In Progress", at: "2025-07-01" },
      { id: "t4", status: "Resolved", at: "2025-10-01" },
    ],
    hearings: [
      {
        id: "h1",
        date: "2025-08-20",
        time: "10:00 AM",
        courtOrVenue: "Family Court, Nampally, Hyderabad",
        note: "First motion recorded",
        createdAt: "2025-07-05",
      },
      {
        id: "h2",
        date: "2025-09-28",
        time: "10:00 AM",
        courtOrVenue: "Family Court, Nampally, Hyderabad",
        note: "Second motion — decree granted",
        createdAt: "2025-09-10",
      },
    ],
  },
  {
    id: "CS-93021",
    title: "Wrongful termination & non-payment of severance",
    description: `WRONGFUL TERMINATION CLAIM STATEMENT:

1. The claimant Venkata Ramana Naidu served as Senior Systems Engineer at TechCorp Solutions Pvt. Ltd., Rushikonda IT Park, Visakhapatnam from 1st August 2022 to 31st October 2025 under a permanent employment agreement.

2. On 31st October 2025, HR issued an immediate termination email citing 'organizational restructuring' without providing the mandatory 90-day contractual notice period, performance improvement plan (PIP), or statutory severance pay under Industrial Disputes Act.

3. The employer has withheld accrued salary for October 2025 (₹1,45,000), encashment of 24 days earned leave, and gratuity benefits. Legal representation challenges termination as arbitrary, demanding reinstatement or compensation of ₹12,80,000.`,
    category: "Labour",
    citizenId: "u_004",
    citizenName: "Venkata Ramana Naidu",
    lawyerId: "l_001",
    lawyerName: "Swathi Reddy",
    status: "Under Review",
    city: "Visakhapatnam",
    createdAt: "2025-11-01",
    updatedAt: "2025-11-12",
    documents: [
      {
        id: "d5",
        name: "CS-93021_Employment_Contract.pdf",
        size: "240 KB",
        uploadedAt: "2025-11-01",
      },
      {
        id: "d6",
        name: "CS-93021_HR_Termination_Notice.pdf",
        size: "95 KB",
        uploadedAt: "2025-11-01",
      },
    ],
    timeline: [
      { id: "t1", status: "Submitted", at: "2025-11-01" },
      { id: "t2", status: "Assigned", at: "2025-11-03" },
      { id: "t3", status: "Under Review", at: "2025-11-08" },
    ],
    hearings: [
      {
        id: "h1",
        date: "2026-09-18",
        time: "11:30 AM",
        courtOrVenue: "Labour Court, Visakhapatnam",
        note: "Preliminary hearing on wrongful termination claim",
        createdAt: "2025-11-10",
      },
    ],
  },
  {
    id: "CS-51204",
    title: "Mehta Textiles Pvt Ltd vs Regional Provident Fund Commissioner, Hyderabad",
    description:
      "Writ petition challenging a provident fund recovery order issued against Mehta Textiles Pvt Ltd, pending before the High Court for the State of Telangana. Imported from eCourts.",
    category: "Labour",
    citizenId: undefined,
    citizenName: "Mehta Textiles Pvt Ltd",
    lawyerId: "l_001",
    lawyerName: "Swathi Reddy",
    status: "Pending",
    city: "Hyderabad",
    createdAt: "2026-07-20",
    updatedAt: "2026-07-20",
    documents: [],
    timeline: [
      {
        id: "t1",
        status: "Pending",
        at: "2026-07-20",
        note: "Imported from eCourts (TSHC010011872026)",
      },
    ],
    hearings: [
      {
        id: "h1",
        date: "2026-08-21",
        time: "10:30 AM",
        courtOrVenue: "High Court for the State of Telangana",
        judges: ["Hon'ble Justice Bench-I"],
        hearingType: "WP-dailylist",
        createdAt: "2026-07-01",
      },
      {
        id: "h2",
        date: "2026-05-14",
        time: "10:30 AM",
        courtOrVenue: "High Court for the State of Telangana",
        judges: ["Hon'ble Justice Bench-I"],
        businessDetails: "Counter filed by respondent; matter posted for arguments.",
        hearingType: "WP-dailylist",
        createdAt: "2026-05-01",
      },
    ],
    caseNumber: "WP/1187/2026",
    cnrNumber: "TSHC010011872026",
    courtName: "High Court for the State of Telangana",
    stage: "COUNTER FILED",
    filingDate: "2026-05-12",
    petitioners: ["Mehta Textiles Pvt Ltd"],
    respondents: ["Regional Provident Fund Commissioner, Hyderabad"],
    petitionerLawyers: ["Swathi Reddy"],
    respondentLawyers: ["Govt. Pleader"],
    source: "ecourt",
  },
  {
    id: "CS-51677",
    title: "K. Padma Rao vs Andhra Pradesh State Road Transport Corporation",
    description:
      "Motor accident compensation claim filed by K. Padma Rao against APSRTC, pending before the Motor Accidents Claims Tribunal, Visakhapatnam. Imported from eCourts.",
    category: "Civil",
    citizenId: undefined,
    citizenName: "K. Padma Rao",
    lawyerId: "l_001",
    lawyerName: "Swathi Reddy",
    status: "In Progress",
    city: "Visakhapatnam",
    createdAt: "2026-06-02",
    updatedAt: "2026-06-02",
    documents: [],
    timeline: [
      {
        id: "t1",
        status: "In Progress",
        at: "2026-06-02",
        note: "Imported from eCourts (APVK020004422026)",
      },
    ],
    hearings: [
      {
        id: "h1",
        date: "2026-08-27",
        time: "11:00 AM",
        courtOrVenue: "Motor Accidents Claims Tribunal, Visakhapatnam",
        judges: ["Chairman, MACT Visakhapatnam"],
        hearingType: "MACT-dailylist",
        createdAt: "2026-07-15",
      },
      {
        id: "h2",
        date: "2026-04-09",
        time: "11:00 AM",
        courtOrVenue: "Motor Accidents Claims Tribunal, Visakhapatnam",
        judges: ["Chairman, MACT Visakhapatnam"],
        businessDetails: "Evidence of claimant recorded; matter posted for cross-examination.",
        hearingType: "MACT-dailylist",
        createdAt: "2026-04-01",
      },
    ],
    caseNumber: "MVOP/442/2026",
    cnrNumber: "APVK020004422026",
    courtName: "Motor Accidents Claims Tribunal, Visakhapatnam",
    stage: "EVIDENCE",
    filingDate: "2026-03-08",
    petitioners: ["K. Padma Rao"],
    respondents: ["Andhra Pradesh State Road Transport Corporation"],
    petitionerLawyers: ["Swathi Reddy"],
    respondentLawyers: ["APSRTC Legal Cell"],
    source: "ecourt",
  },
];

export const notifications: AppNotification[] = [
  {
    id: "n1",
    title: "Lawyer assigned",
    body: "Swathi Reddy has been assigned to CS-34253.",
    at: "2025-11-02 10:14",
    read: false,
    role: "citizen",
  },
  {
    id: "n2",
    title: "Documents requested",
    body: "Please upload the FIR copy for CS-78902.",
    at: "2025-11-14 09:02",
    read: false,
    role: "citizen",
  },
  {
    id: "n3",
    title: "Status updated",
    body: "CS-45119 marked as Resolved.",
    at: "2025-10-01 17:22",
    read: true,
    role: "citizen",
  },
  {
    id: "nl1",
    title: "New Case Assignment",
    body: "You have been assigned to Property Dispute CS-34253.",
    at: "2025-11-02 10:15",
    read: false,
    role: "lawyer",
  },
  {
    id: "nl2",
    title: "Client Document Uploaded",
    body: "Lakshmi Prasanna uploaded invoice.pdf for CS-61847.",
    at: "2025-11-10 11:30",
    read: false,
    role: "lawyer",
  },
  {
    id: "na1",
    title: "New Lawyer Verification",
    body: "Sailaja Naidu submitted bar credentials for verification.",
    at: "2025-11-12 14:00",
    read: false,
    role: "admin",
  },
  {
    id: "na2",
    title: "Case Auto-Assignment Pending",
    body: "CS-93021 requires Lawyer allocation.",
    at: "2025-11-13 09:45",
    read: false,
    role: "admin",
  },
];

export const knowledgeBase: KnowledgeItem[] = [
  // 1 — Criminal Law
  {
    id: "kb01",
    title: "Bharatiya Nyaya Sanhita (BNS) 2023 — Complete Act & Commentary",
    type: "Act",
    category: "Criminal",
    uploadedAt: "2025-01-10",
    size: "4.2 MB",
  },
  {
    id: "kb02",
    title: "Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 — Criminal Procedure Manual",
    type: "Act",
    category: "Criminal",
    uploadedAt: "2025-01-15",
    size: "3.8 MB",
  },
  // 3 — Property Law
  {
    id: "kb03",
    title: "Transfer of Property Act 1882 — Annotated Commentary (2024 Edition)",
    type: "Act",
    category: "Property",
    uploadedAt: "2025-03-10",
    size: "3.1 MB",
  },
  {
    id: "kb04",
    title: "RERA 2016 & Registration Act 1908 — Property Transaction Compliance Guide",
    type: "Rule",
    category: "Property",
    uploadedAt: "2025-04-20",
    size: "2.4 MB",
  },
  // 5 — Consumer Law
  {
    id: "kb05",
    title: "Consumer Protection Act 2019 — Rules, E-Commerce Regulations & NCDRC Practice",
    type: "Act",
    category: "Consumer",
    uploadedAt: "2025-02-18",
    size: "2.1 MB",
  },
  {
    id: "kb06",
    title: "NCDRC Key Rulings on Defective Goods & Service Deficiency (2021–2025)",
    type: "Judgement",
    category: "Consumer",
    uploadedAt: "2025-04-25",
    size: "1.6 MB",
  },
  // 7 — Cyber Law
  {
    id: "kb07",
    title: "Information Technology Act 2000 — Sections 43, 66, 66C & 66D Enforcement Manual",
    type: "Act",
    category: "Cyber",
    uploadedAt: "2025-03-18",
    size: "1.4 MB",
  },
  {
    id: "kb08",
    title:
      "RBI Master Direction on Customer Protection in Unauthorised Electronic Banking Transactions (RBI/2017-18/15)",
    type: "Rule",
    category: "Cyber",
    uploadedAt: "2025-04-05",
    size: "850 KB",
  },
  // 9 — Family Law
  {
    id: "kb09",
    title:
      "Hindu Marriage Act 1955 — Sections 13 & 13-B Divorce Proceedings, Mutual Consent & Case Laws",
    type: "Act",
    category: "Family",
    uploadedAt: "2025-05-12",
    size: "1.5 MB",
  },
  {
    id: "kb10",
    title: "Protection of Women from Domestic Violence Act 2005 — Procedure & Remedies Guide",
    type: "Act",
    category: "Family",
    uploadedAt: "2025-05-28",
    size: "1.2 MB",
  },
  // 11 — Labour Law
  {
    id: "kb11",
    title: "Industrial Disputes Act 1947 — Sections 25-F, 25-G & Severance Compensation Framework",
    type: "Act",
    category: "Labour",
    uploadedAt: "2025-06-20",
    size: "1.1 MB",
  },
  {
    id: "kb12",
    title: "Code on Wages 2019 — Minimum Wages, Bonus, Equal Pay & Enforcement Procedures",
    type: "Act",
    category: "Labour",
    uploadedAt: "2025-07-05",
    size: "1.8 MB",
  },
  // 13 — Corporate Law
  {
    id: "kb13",
    title:
      "Companies Act 2013 — Directors' Liability, Fraud & SFIO Investigation (Sections 206–229)",
    type: "Act",
    category: "Corporate",
    uploadedAt: "2025-08-01",
    size: "2.9 MB",
  },
  {
    id: "kb14",
    title:
      "Insolvency and Bankruptcy Code 2016 — Corporate Insolvency Resolution Process (CIRP) Guide",
    type: "Act",
    category: "Corporate",
    uploadedAt: "2025-08-18",
    size: "3.3 MB",
  },
  // 15 — Tax Law
  {
    id: "kb15",
    title:
      "Income Tax Act 1961 — Assessment, Appeals & Penalties (Sections 143–158) Practitioner Guide",
    type: "Act",
    category: "Tax",
    uploadedAt: "2025-09-03",
    size: "4.0 MB",
  },
  {
    id: "kb16",
    title:
      "GST Council Circulars on Input Tax Credit Reversal & Anti-Profiteering Orders (2024–2025)",
    type: "Rule",
    category: "Tax",
    uploadedAt: "2025-09-20",
    size: "1.1 MB",
  },
  // 17 — Environmental Law
  {
    id: "kb17",
    title:
      "Environment Protection Act 1986 & NGT Act 2010 — Pollution Liability & Remediation Orders",
    type: "Act",
    category: "Environmental",
    uploadedAt: "2025-10-10",
    size: "2.2 MB",
  },
  {
    id: "kb18",
    title:
      "National Green Tribunal Landmark Judgements on Industrial Air & Water Pollution (2021–2025)",
    type: "Judgement",
    category: "Environmental",
    uploadedAt: "2025-10-28",
    size: "1.7 MB",
  },
  // 19 — Civil Law
  {
    id: "kb19",
    title:
      "Code of Civil Procedure 1908 — Interim Injunctions: Order XXXIX Rules 1 & 2 Practical Manual",
    type: "Rule",
    category: "Civil",
    uploadedAt: "2025-11-05",
    size: "1.5 MB",
  },
  {
    id: "kb20",
    title:
      "Specific Relief Act 1963 (Amendment 2018) — Mandatory Injunction & Specific Performance Judgements",
    type: "Act",
    category: "Civil",
    uploadedAt: "2025-11-15",
    size: "1.3 MB",
  },
];

export function generateAIReport(caseId: string, briefText: string): AIReport {
  return {
    caseId,
    summary:
      "AI Analysis concludes the matter involves strong statutory grounds for immediate preliminary motion. The evidence presented warrants priority filing before competent jurisdiction.",
    confidenceScore: 0.94,
    arguments: [
      "Petitioner holds clear registered legal title and certified municipal survey records.",
      "Opposing party initiated actions without serving mandatory statutory notice under relevant procedural acts.",
      "Documented timeline of events establishes estoppel against counter claims.",
    ],
    counterArguments: [
      "Opposing party may challenge boundary alignment based on historical uncertified site logs.",
      "Potential argument regarding limitation period if preliminary notice service date is disputed.",
    ],
    applicableSections: [
      {
        section: "Specific Relief Act § 41",
        description: "Injunction when refused — grounds for protecting registered plot boundaries.",
      },
      {
        section: "Indian Contract Act § 73",
        description: "Compensation for loss or damage caused by breach of contract.",
      },
      {
        section: "BNSS § 223",
        description: "Procedure for taking cognizance and examining preliminary complaints.",
      },
    ],
    relevantActs: [
      "Bharatiya Nyaya Sanhita (BNS) 2023",
      "Specific Relief Act, 1963",
      "Code of Civil Procedure, 1908",
    ],
    recommendations: [
      "File an immediate application under Order 7 Rule 11 CPC questioning maintainability.",
      "Serve certified municipal survey report as primary Exhibit A.",
      "Apply for ex-parte temporary injunction to restrain further site alterations.",
    ],
  };
}
