/* Full practice-area → specialization → legal-service taxonomy for the
   "Find a Lawyer" mega-menu (desktop) and drawer accordion (mobile). These
   are marketing labels for browsing only, not tied to the app's internal
   LegalCategory enum — every leaf link just routes into the citizen login
   flow, the same way the rest of the public CTAs do. Shared by PublicNav
   (desktop) and PublicLayout (mobile) so the two stay in sync. */
export interface LawyerSpecialization {
  name: string;
  legalServices: string[];
}

export interface LawyerPracticeArea {
  name: string;
  specializations: LawyerSpecialization[];
}

export const LAWYER_PRACTICE_AREAS: LawyerPracticeArea[] = [
  {
    name: "Criminal Defense",
    specializations: [
      {
        name: "Anticipatory Bail",
        legalServices: [
          "File Anticipatory Bail Application",
          "Anticipatory Bail Hearing",
          "Anticipatory Bail Appeal",
        ],
      },
      {
        name: "Criminal",
        legalServices: [
          "File Criminal Case",
          "Criminal Defense",
          "Criminal Case Consultation",
          "Criminal Appeal",
          "Criminal Revision",
        ],
      },
      {
        name: "Cyber Crime",
        legalServices: [
          "Cyber Crime Complaint",
          "Cyber Fraud Case",
          "Online Harassment Case",
          "Cyber Crime Defense",
          "Cyber Crime Investigation Assistance",
        ],
      },
      {
        name: "Fraud Case",
        legalServices: [
          "File Fraud Case",
          "Fraud Case Defense",
          "Financial Fraud Complaint",
          "Fraud Case Appeal",
        ],
      },
      {
        name: "Litigation",
        legalServices: [
          "Civil Litigation",
          "Criminal Litigation",
          "Court Representation",
          "File Lawsuit",
          "Litigation Consultation",
        ],
      },
      {
        name: "POCSO Act",
        legalServices: [
          "POCSO Case Filing",
          "POCSO Case Defense",
          "POCSO Bail Application",
          "POCSO Case Representation",
          "POCSO Appeal",
        ],
      },
      {
        name: "Anti Corruption",
        legalServices: [
          "Anti Corruption Complaint",
          "Anti Corruption Case Defense",
          "Vigilance Case",
          "Anti Corruption Litigation",
        ],
      },
      {
        name: "PMLA",
        legalServices: [
          "PMLA Case Defense",
          "PMLA Bail Application",
          "PMLA Property Attachment Matter",
          "PMLA Case Representation",
          "PMLA Appeal",
        ],
      },
    ],
  },
  {
    name: "Corporate Law",
    specializations: [
      {
        name: "Arbitration",
        legalServices: [
          "Arbitration Consultation",
          "File Arbitration Case",
          "Arbitration Representation",
          "Arbitration Award Challenge",
          "Arbitration Appeal",
        ],
      },
      {
        name: "Startup",
        legalServices: [
          "Startup Legal Consultation",
          "Business Registration",
          "Founder Agreement",
          "Shareholder Agreement",
          "Startup Compliance",
        ],
      },
      {
        name: "Corporate",
        legalServices: [
          "Corporate Legal Consultation",
          "Company Law Compliance",
          "Corporate Dispute",
          "Board and Shareholder Matters",
          "Corporate Representation",
        ],
      },
      {
        name: "Breach of Contract",
        legalServices: [
          "Contract Review",
          "Breach of Contract Notice",
          "Breach of Contract Case",
          "Contract Dispute Resolution",
          "Contract Litigation",
        ],
      },
      {
        name: "NCLT",
        legalServices: [
          "NCLT Case Filing",
          "NCLT Representation",
          "Company Petition",
          "NCLT Appeal",
          "Corporate Insolvency Matter",
        ],
      },
      {
        name: "Bankruptcy / Insolvency",
        legalServices: [
          "Insolvency Consultation",
          "Insolvency Proceedings",
          "Bankruptcy Proceedings",
          "IBC Case Filing",
          "Insolvency Representation",
        ],
      },
      {
        name: "Patent",
        legalServices: [
          "Patent Search",
          "Patent Application",
          "Patent Registration",
          "Patent Infringement Case",
          "Patent Opposition",
        ],
      },
      {
        name: "Media and Entertainment",
        legalServices: [
          "Media Legal Consultation",
          "Entertainment Contract",
          "Copyright Dispute",
          "Defamation Matter",
          "Media Litigation",
        ],
      },
      {
        name: "Trademark & Copyright",
        legalServices: [
          "Trademark Search",
          "Trademark Registration",
          "Trademark Infringement",
          "Copyright Registration",
          "Copyright Infringement",
        ],
      },
      {
        name: "Documentation",
        legalServices: [
          "Legal Document Drafting",
          "Agreement Drafting",
          "Contract Drafting",
          "Document Review",
          "Legal Documentation",
        ],
      },
    ],
  },
  {
    name: "Family Law",
    specializations: [
      {
        name: "Wills / Trusts",
        legalServices: [
          "Will Drafting",
          "Will Registration",
          "Will Review",
          "Trust Deed Drafting",
          "Trust Registration",
        ],
      },
      {
        name: "Child Custody",
        legalServices: [
          "Child Custody Case",
          "Child Custody Petition",
          "Child Visitation Matter",
          "Child Custody Dispute",
          "Child Custody Appeal",
        ],
      },
      {
        name: "Muslim Law",
        legalServices: [
          "Muslim Marriage Matter",
          "Muslim Divorce Matter",
          "Muslim Personal Law Consultation",
          "Muslim Inheritance Matter",
          "Muslim Family Dispute",
        ],
      },
      {
        name: "Domestic Violence",
        legalServices: [
          "Domestic Violence Complaint",
          "Domestic Violence Case",
          "Protection Order",
          "Domestic Violence Defense",
          "Domestic Violence Appeal",
        ],
      },
      {
        name: "Succession Certificate",
        legalServices: [
          "Succession Certificate Application",
          "Succession Certificate Case",
          "Succession Certificate Consultation",
          "Succession Certificate Appeal",
        ],
      },
      {
        name: "Divorce",
        legalServices: [
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
        legalServices: [
          "Family Dispute",
          "Family Settlement",
          "Maintenance Matter",
          "Family Court Representation",
          "Family Legal Consultation",
        ],
      },
      {
        name: "Court Marriage",
        legalServices: [
          "Court Marriage Registration",
          "Marriage Registration",
          "Special Marriage Act Registration",
          "Court Marriage Documentation",
        ],
      },
      {
        name: "Dowry Case",
        legalServices: [
          "Dowry Complaint",
          "Dowry Harassment Case",
          "Dowry Case Defense",
          "Dowry Case Representation",
          "Dowry Case Appeal",
        ],
      },
    ],
  },
  {
    name: "Banking & Finance",
    specializations: [
      {
        name: "Cheque Bounce",
        legalServices: [
          "Cheque Bounce Legal Notice",
          "File Cheque Bounce Case",
          "Cheque Bounce Case Defense",
          "Cheque Bounce Settlement",
          "Cheque Bounce Appeal",
        ],
      },
      {
        name: "Recovery",
        legalServices: [
          "Money Recovery Notice",
          "Debt Recovery Case",
          "Loan Recovery Matter",
          "Recovery Suit",
          "Debt Settlement",
        ],
      },
      {
        name: "Tax",
        legalServices: [
          "Tax Consultation",
          "Income Tax Matter",
          "Tax Notice Reply",
          "Tax Dispute",
          "Tax Appeal",
        ],
      },
      {
        name: "Banking / Finance",
        legalServices: [
          "Banking Dispute",
          "Loan Dispute",
          "Banking Legal Notice",
          "Financial Agreement Review",
          "Banking Litigation",
        ],
      },
      {
        name: "GST",
        legalServices: [
          "GST Registration",
          "GST Notice Reply",
          "GST Compliance",
          "GST Dispute",
          "GST Appeal",
        ],
      },
      {
        name: "Customs & Central Excise",
        legalServices: [
          "Customs Consultation",
          "Customs Dispute",
          "Customs Notice Reply",
          "Central Excise Matter",
          "Customs Appeal",
        ],
      },
    ],
  },
  {
    name: "Consumer Law",
    specializations: [
      {
        name: "Insurance",
        legalServices: [
          "Insurance Claim Dispute",
          "Insurance Claim Rejection",
          "Insurance Legal Notice",
          "Insurance Consumer Case",
          "Insurance Appeal",
        ],
      },
      {
        name: "Medical Negligence",
        legalServices: [
          "Medical Negligence Consultation",
          "Medical Negligence Complaint",
          "Medical Negligence Case",
          "Medical Negligence Consumer Case",
          "Medical Negligence Defense",
        ],
      },
      {
        name: "Motor Accident",
        legalServices: [
          "Motor Accident Claim",
          "Motor Accident Compensation",
          "Motor Accident Case",
          "Motor Accident Tribunal Matter",
          "Motor Accident Appeal",
        ],
      },
      {
        name: "Consumer Court",
        legalServices: [
          "Consumer Complaint",
          "Consumer Legal Notice",
          "Consumer Court Representation",
          "Consumer Dispute",
          "Consumer Court Appeal",
        ],
      },
    ],
  },
  {
    name: "Higher Courts",
    specializations: [
      {
        name: "Armed Forces Tribunal",
        legalServices: [
          "AFT Case Filing",
          "AFT Representation",
          "Service Matter Appeal",
          "Armed Forces Legal Consultation",
        ],
      },
      {
        name: "Supreme Court",
        legalServices: [
          "Supreme Court Case Filing",
          "Supreme Court Representation",
          "Special Leave Petition (SLP)",
          "Supreme Court Appeal",
          "Supreme Court Legal Consultation",
        ],
      },
      {
        name: "High Court",
        legalServices: [
          "High Court Case Filing",
          "High Court Representation",
          "Writ Petition",
          "High Court Appeal",
          "High Court Bail Application",
          "High Court Legal Consultation",
        ],
      },
    ],
  },
  {
    name: "International Law",
    specializations: [
      {
        name: "Immigration",
        legalServices: [
          "Immigration Consultation",
          "Visa Legal Assistance",
          "Immigration Application",
          "Immigration Appeal",
          "Immigration Dispute",
        ],
      },
      {
        name: "International Law",
        legalServices: [
          "International Legal Consultation",
          "Cross Border Dispute",
          "International Contract Matter",
          "International Arbitration",
          "International Litigation",
        ],
      },
      {
        name: "NRI",
        legalServices: [
          "NRI Legal Consultation",
          "NRI Property Matter",
          "NRI Family Dispute",
          "NRI Documentation",
          "NRI Power of Attorney",
        ],
      },
    ],
  },
  {
    name: "Labour & Civil Matters",
    specializations: [
      {
        name: "Labour & Service",
        legalServices: [
          "Employment Dispute",
          "Wrongful Termination Matter",
          "Salary / Wage Dispute",
          "Service Matter",
          "Labour Court Case",
        ],
      },
      {
        name: "R.T.I",
        legalServices: ["RTI Application", "RTI Appeal", "RTI Legal Consultation", "RTI Complaint"],
      },
      {
        name: "Civil",
        legalServices: [
          "Civil Suit",
          "Civil Dispute",
          "Civil Litigation",
          "Civil Appeal",
          "Civil Legal Notice",
        ],
      },
    ],
  },
  {
    name: "Property Law",
    specializations: [
      {
        name: "Landlord/Tenant",
        legalServices: [
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
        legalServices: [
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
        legalServices: [
          "RERA Complaint",
          "RERA Case Filing",
          "Builder Delay Case",
          "Builder Fraud Case",
          "Property Possession Dispute",
          "RERA Appeal",
        ],
      },
    ],
  },
];
