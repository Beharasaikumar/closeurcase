import {
  Mic,
  Sparkles,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Users,
  FileText,
  Gavel,
  Landmark,
  ShoppingBag,
  Briefcase,
} from "lucide-react";

export const HERO_TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Bar verified Lawyers",
    subtitle: "Trusted and verified professionals",
  },
  {
    icon: Users,
    title: "Matched to your case type",
    subtitle: "Right Advocate for your matter",
  },
  {
    icon: FileText,
    title: "Auto-Assign & Subscriptions",
    subtitle: "Fast lawyer assignment & support",
  },
];

export const PRACTICE_CATEGORIES = [
  {
    id: "property",
    title: "Property and Civil Disputes",
    icon: Gavel,
    image: "/property-civil-disputes.png",
    altText:
      "Illustration of a divided house representing property partition, land disputes, and title suits",
    court: "District and Sessions Court",
    act: "Code of Civil Procedure 1908",
    remedy: "Partition, Injunction and Title Suits",
    link: "/citizen-login",
  },
  {
    id: "family",
    title: "Family and Custody Matters",
    icon: Users,
    image: "/family-custody-matters.png",
    altText:
      "Vector illustration of parents and child representing family court divorce and custody legal matters",
    court: "Family Court / District Court",
    act: "Hindu Marriage Act and Guardianship Acts",
    remedy: "Mutual Divorce and Child Custody",
    link: "/citizen-login",
  },
  {
    id: "corporate",
    title: "Corporate and Financial Recovery",
    icon: Briefcase,
    image: "/corporate-financial-recovery.png",
    altText:
      "Illustration of corporate debt recovery, NCLT proceedings, and financial restructuring",
    court: "NCLT and DRT",
    act: "Insolvency and Bankruptcy Code / SARFAESI",
    remedy: "Debt Recovery and Restructuring",
    link: "/citizen-login",
  },
  {
    id: "consumer",
    title: "Consumer Claims and Recovery",
    icon: ShoppingBag,
    image: "/consumer-claims-recovery.png",
    altText:
      "Illustration of consumer protection shield, grievance recovery, and Lok Adalat claims",
    court: "Consumer Commission and Lok Adalat",
    act: "Consumer Protection Act 2019",
    remedy: "Compensation and Speedy Settlement",
    link: "/citizen-login",
  },
];

export const STEPS = [
  {
    step: 1,
    icon: Mic,
    title: "Describe your matter",
    desc: "Tell us what happened by text or voice in the language you are most comfortable with.",
  },
  {
    step: 2,
    icon: Sparkles,
    title: "Get matched",
    desc: "We connect you with a bar verified Lawyer who handles exactly this type of case.",
  },
  {
    step: 3,
    icon: Activity,
    title: "Stay informed",
    desc: "Track every hearing date, document submission, and status change in real time.",
  },
  {
    step: 4,
    icon: CheckCircle2,
    title: "Reach resolution",
    desc: "Your Lawyer takes it from filing to closure and you are informed at every step.",
  },
];

export const ABOUT_HIGHLIGHTS = [
  "Your case description is read and matched to the right legal category",
  "Connected to a bar verified Lawyer near you or assigned by our team",
  "Every hearing date, document, and status is tracked and surfaced to you",
  "No Lawyer appears on the platform without verification by our team",
];

export const INDIAN_COURTS = [
  {
    id: "district",
    title: "District and Sessions Courts",
    subtitle:
      "Primary trial courts handling civil, family, property, and criminal matters at the district level",
    icon: Gavel,
    badge: "Trial Courts",
    matters: [
      "Property partition, land disputes, and title suits",
      "Family matters including divorce, maintenance, and child custody",
      "Cheque bounce cases under Section 138 of Negotiable Instruments Act",
      "Criminal trials, bail applications, and breach of contract suits",
    ],
    ctaLabel: "File a District Court Case",
  },
  {
    id: "highcourt",
    title: "High Courts of India",
    subtitle:
      "State level constitutional courts exercising writ jurisdiction, appeals, and original jurisdiction",
    icon: Landmark,
    badge: "Appellate and Constitutional",
    matters: [
      "Writ petitions under Article 226 for enforcement of fundamental rights",
      "First and second legal appeals against District Court judgments",
      "Anticipatory bail applications and quashing of police complaints",
      "Company disputes and commercial suits of high financial value",
    ],
    ctaLabel: "File a High Court Matter",
  },
  {
    id: "consumer",
    title: "Consumer Commissions and Lok Adalat",
    subtitle:
      "Dedicated forums for consumer grievances, service deficiency claims, and mutual settlements",
    icon: ShoppingBag,
    badge: "Consumer and ADR",
    matters: [
      "Defective goods, faulty electronics, and e commerce grievances",
      "Deficiency in services by builders, banks, or insurance companies",
      "Speedy compromise settlements through Lok Adalat with zero court fee",
      "Compensation claims for unfair trade practices and delayed delivery",
    ],
    ctaLabel: "File a Consumer Claim",
  },
  {
    id: "tribunals",
    title: "Specialised Tribunals NCLT, DRT, and CAT",
    subtitle: "Statutory bodies for corporate law, debt recovery, and public service disputes",
    icon: Briefcase,
    badge: "Specialised Tribunals",
    matters: [
      "Company insolvency and restructuring under Insolvency and Bankruptcy Code",
      "Shareholder oppression, management disputes, and merger approvals",
      "Bank debt recovery under SARFAESI Act and Tribunal proceedings",
      "Government service matters, pensions, and administrative grievances",
    ],
    ctaLabel: "File a Tribunal Matter",
  },
];

export const CITIZEN_TESTIMONIALS = [
  {
    name: "Rajesh Kumar V.",
    role: "Property Dispute Client",
    rating: 5,
    quote:
      "CloseUrCase connected me with a senior property Advocate within hours. Every hearing date was updated on my phone, and we resolved our property partition suit smoothly.",
  },
  {
    name: "Anitha Rao M.",
    role: "Consumer Grievance Client",
    rating: 5,
    quote:
      "Filing a consumer claim against a builder seemed overwhelming until I used CloseUrCase. The assigned Lawyer guided me through the Consumer Commission process effortlessly.",
  },
];

export const PRACTICE_GRID = [
  { title: "Civil Litigation", desc: "Property partition, title suits, contracts", icon: Gavel },
  { title: "Family and Custody", desc: "Divorce, alimony, child guardianship", icon: Users },
  { title: "Cheque Bounce Sec 138", desc: "Negotiable Instruments legal recovery", icon: FileText },
  { title: "Corporate Insolvency", desc: "NCLT proceedings and debt recovery", icon: Briefcase },
  {
    title: "Consumer Protection",
    desc: "Service deficiency and builder claims",
    icon: ShoppingBag,
  },
  { title: "High Court Writs", desc: "Article 226 constitutional petitions", icon: Landmark },
];
