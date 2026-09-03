import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  FileSearch,
  FilePlus2,
  Image as ImageIcon,
  Paperclip,
  Mic,
  Square,
  X,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Users,
  Scale,
  ArrowLeft,
  ChevronDown,
  Check,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { UserAvatar } from "@/components/app/UserAvatar";
import { LawyerProfileCard } from "@/components/app/LawyerProfileCard";
import { usePwaInstall } from "@/lib/usePwaInstall";
import {
  LAWYER_PRACTICE_AREAS,
  mapPracticeAreaToCategory,
} from "@/components/app/lawyerPracticeAreas";
import { addCase, addSubscription, getLawyers, generateCloseUrCaseId } from "@/data/appStore";
import { SUBSCRIPTION_PLANS } from "@/data/subscriptionPlans";
import { useSpeechToText } from "@/features/citizen/useSpeechToText";
import { distanceToCity } from "@/lib/geo";
import { useUserLocation } from "@/lib/useUserLocation";
import { MAX_ATTACHMENT_BYTES, readFileAsDataUrl } from "@/lib/files";
import type {
  CaseDocument,
  CaseStatus,
  LegalCase,
  LegalCategory,
  Lawyer,
  SubscriptionPlanId,
} from "@/types";
import {
  Button,
  TextField,
  Card,
  CircularProgress,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  IconButton,
  Select,
} from "@/components/m3";

export const Route = createFileRoute("/citizen/create-case")({
  head: () => ({ meta: [{ title: "Find a Lawyer — CloseUrCase" }] }),
  component: FindLawyerWizard,
});

type CasePath = "existing" | "new";
type Step = "details" | "assign" | "payment" | "done";
type AssignMode = "browse" | "admin" | null;

const FEE = 499;
const CITIZEN_ID = "u_001";
const CITIZEN_NAME = "Sai Teja Reddy";
const CITIZEN_CITY = "Hyderabad";

/* Same mocked-AI keyword heuristic the old wizard used for category prediction —
   no real LLM call, just enough to make the "AI analysed your case" step feel real. */
function predictCategory(text: string): LegalCategory {
  const t = text.toLowerCase();
  if (t.includes("upi") || t.includes("hack") || t.includes("cyber")) return "Cyber";
  if (t.includes("land") || t.includes("plot") || t.includes("property") || t.includes("boundary"))
    return "Property";
  if (t.includes("divorce") || t.includes("custody") || t.includes("spouse")) return "Family";
  if (t.includes("refund") || t.includes("defective")) return "Consumer";
  if (t.includes("fired") || t.includes("salary") || t.includes("termination")) return "Labour";
  if (t.includes("police") || t.includes("fir") || t.includes("assault")) return "Criminal";
  return "Civil";
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FindLawyerWizard() {
  const navigate = useNavigate();
  const { coords: userCoords, cityLabel: userCityLabel, loading: locating } = useUserLocation();
  const [step, setStep] = useState<Step>("details");
  const [path, setPath] = useState<CasePath | null>(null);

  // Client name — required for every submission, not assumed from session
  const [clientName, setClientName] = useState("");
  const [clientNameTouched, setClientNameTouched] = useState(false);

  // Client name — required for every submission, not assumed from session
  const [clientName, setClientName] = useState("");
  const [clientNameTouched, setClientNameTouched] = useState(false);

  // Existing case
  const [cnr, setCnr] = useState("");
  const [existingCaseStatus, setExistingCaseStatus] = useState<"Pending" | "Closed">("Pending");

  // New case
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  // Whether the citizen knows their case's legal category already — if so,
  // skip the mocked-AI classification and let them pick it directly via the
  // same Practice Area -> Specialization -> Legal Service cascade used to
  // browse the lawyer directory, instead of a flat category dropdown.
  const [knowsCaseType, setKnowsCaseType] = useState<boolean | null>(null);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  // Legal Service is multi-select — defaults to "all services under the
  // chosen specialization" the moment a specialization is picked.
  const [selectedLegalServices, setSelectedLegalServices] = useState<string[]>([]);
  // Whether the citizen knows their case's legal category already — if so,
  // skip the mocked-AI classification and let them pick it directly via the
  // same Practice Area -> Specialization -> Legal Service cascade used to
  // browse the lawyer directory, instead of a flat category dropdown.
  const [knowsCaseType, setKnowsCaseType] = useState<boolean | null>(null);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  // Legal Service is multi-select — defaults to "all services under the
  // chosen specialization" the moment a specialization is picked.
  const [selectedLegalServices, setSelectedLegalServices] = useState<string[]>([]);
  const baseDescriptionRef = useRef("");
  const {
    isRecording,
    error: voiceError,
    start: startVoiceRecognition,
    stop: stopVoiceRecognition,
  } = useSpeechToText((finalText, interimText) => {
    const combined = [baseDescriptionRef.current, finalText, interimText]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    setDescription(combined);
  });

  // AI category analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictedCategory, setPredictedCategory] = useState<LegalCategory | null>(null);

  // Assign lawyer
  const [assignMode, setAssignMode] = useState<AssignMode>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState("");
  const [profileLawyer, setProfileLawyer] = useState<Lawyer | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlanId | null>(null);

  const [isPaying, setIsPaying] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState("");
  const [assignedLawyerName, setAssignedLawyerName] = useState("");
  const [adminAssignRequested, setAdminAssignRequested] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const hasNewCaseContent =
    description.trim().length > 0 || images.length > 0 || documents.length > 0;
  const hasDescriptionText = description.trim().length > 0;

  const hasClientName = clientName.trim().length > 0;

  const hasManualCategoryPick = selectedPracticeArea !== "" && selectedSpecialization !== "";
  const hasDescriptionText = description.trim().length > 0;

  const hasClientName = clientName.trim().length > 0;

  const hasManualCategoryPick = selectedPracticeArea !== "" && selectedSpecialization !== "";

  const canContinueDetails =
    hasClientName &&
    (path === "existing"
      ? cnr.trim().length > 0
      : path === "new"
        ? hasNewCaseContent &&
          knowsCaseType !== null &&
          (knowsCaseType === true ? hasManualCategoryPick : hasDescriptionText)
        : false);

  // Tells the citizen exactly what's missing when Continue is disabled,
  // instead of leaving them to guess (the required fields aren't all
  // visible at once once the form scrolls).
  const missingDetailsReason = (() => {
    if (!hasClientName) return "Enter the client's name to continue.";
    if (path === null) return "Choose Existing Case or New Case to continue.";
    if (path === "existing" && cnr.trim().length === 0) return "Enter your CNR number to continue.";
    if (path === "new") {
      if (!hasNewCaseContent) {
        return "Describe your issue, or add a photo/document, to continue.";
      }
      if (knowsCaseType === null) {
        return "Let us know whether you know the legal category to continue.";
      }
      if (knowsCaseType === true && selectedPracticeArea === "") {
        return "Select a Practice Area to continue.";
      }
      if (knowsCaseType === true && selectedSpecialization === "") {
        return "Select a Specialization to continue.";
      }
      if (knowsCaseType === false && !hasDescriptionText) {
        return "Describe your issue in a few words so we can identify the legal category.";
      }
    }
    return null;
  })();
    hasClientName &&
    (path === "existing"
      ? cnr.trim().length > 0
      : path === "new"
        ? hasNewCaseContent &&
          knowsCaseType !== null &&
          (knowsCaseType === true ? hasManualCategoryPick : hasDescriptionText)
        : false);

  // Tells the citizen exactly what's missing when Continue is disabled,
  // instead of leaving them to guess (the required fields aren't all
  // visible at once once the form scrolls).
  const missingDetailsReason = (() => {
    if (!hasClientName) return "Enter the client's name to continue.";
    if (path === null) return "Choose Existing Case or New Case to continue.";
    if (path === "existing" && cnr.trim().length === 0) return "Enter your CNR number to continue.";
    if (path === "new") {
      if (!hasNewCaseContent) {
        return "Describe your issue, or add a photo/document, to continue.";
      }
      if (knowsCaseType === null) {
        return "Let us know whether you know the legal category to continue.";
      }
      if (knowsCaseType === true && selectedPracticeArea === "") {
        return "Select a Practice Area to continue.";
      }
      if (knowsCaseType === true && selectedSpecialization === "") {
        return "Select a Specialization to continue.";
      }
      if (knowsCaseType === false && !hasDescriptionText) {
        return "Describe your issue in a few words so we can identify the legal category.";
      }
    }
    return null;
  })();

  const canContinueAssign =
    (assignMode === "admin" && subscriptionPlan !== null) ||
    (assignMode === "browse" && selectedLawyerId !== "");

  const currentPracticeAreaObj = useMemo(
    () => LAWYER_PRACTICE_AREAS.find((pa) => pa.category === selectedPracticeArea),
    [selectedPracticeArea],
  );
  const availableSpecializations = useMemo(
    () => currentPracticeAreaObj?.case_types ?? [],
    [currentPracticeAreaObj],
  );

  const currentSpecializationObj = useMemo(
    () => availableSpecializations.find((s) => s.case_type === selectedSpecialization),
    [availableSpecializations, selectedSpecialization],
  );
  const availableLegalServices = currentSpecializationObj?.legal_services ?? [];

  function handlePracticeAreaChange(v: string) {
    setSelectedPracticeArea(v);
    setSelectedSpecialization("");
    setSelectedLegalServices([]);
    setSelectedLegalServices([]);
  }

  function handleSpecializationChange(v: string) {
    setSelectedSpecialization(v);
    const spec = availableSpecializations.find((s) => s.case_type === v);
    // All legal services under the new specialization are selected by default.
    setSelectedLegalServices(spec?.legal_services ?? []);
  }

  function toggleLegalService(service: string) {
    setSelectedLegalServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    );
  }

  const approvedLawyers = useMemo(() => getLawyers().filter((l) => l.status === "Approved"), []);

  const sortedLawyers = useMemo(() => {
    // Unrecognized city names (free-text on lawyer self-registration) sort last
    // rather than being guessed at.
    const distance = (city: string) =>
      distanceToCity(userCoords.lat, userCoords.lng, city) ?? Number.MAX_SAFE_INTEGER;
    // Prefer the deepest picked level for category mapping — some
    // specializations (e.g. "Cyber Crime" under "Criminal Defense") carry a
    // more specific keyword than their parent practice area, so narrowing
    // that far should surface the right category-tagged lawyers.
    const categorySource = selectedSpecialization || selectedPracticeArea;
    const mappedCategory = categorySource ? mapPracticeAreaToCategory(categorySource) : null;
    return approvedLawyers
      .filter((l) => !mappedCategory || l.category === mappedCategory)
      .filter((l) => !selectedSpecialization || l.specializations?.includes(selectedSpecialization))
      .sort((a, b) => {
        const da = distance(a.city);
        const db = distance(b.city);
        if (da !== db) return da - db;
        if (predictedCategory) {
          const aCat = a.category === predictedCategory ? 0 : 1;
          const bCat = b.category === predictedCategory ? 0 : 1;
          if (aCat !== bCat) return aCat - bCat;
        }
        return b.rating - a.rating;
      });
  }, [
    approvedLawyers,
    predictedCategory,
    userCoords,
    selectedPracticeArea,
    selectedSpecialization,
  ]);

  const selectedLawyer: Lawyer | undefined = sortedLawyers.find((l) => l.id === selectedLawyerId);
  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscriptionPlan);
  const totalFee = assignMode === "admin" && selectedPlan ? selectedPlan.price : FEE;

  function handleRecordVoiceNote() {
    if (isRecording) {
      stopVoiceRecognition();
      return;
    }
    baseDescriptionRef.current = description.trim();
    startVoiceRecognition();
  }

  function handleContinueFromDetails() {
    // The citizen already told us the category via the Practice Area picker —
    // use it directly, no fake AI classification needed.
    if (path === "new" && knowsCaseType === true && hasManualCategoryPick) {
      setPredictedCategory(mapPracticeAreaToCategory(selectedPracticeArea));
      setStep("assign");
      return;
    }

    // The citizen already told us the category via the Practice Area picker —
    // use it directly, no fake AI classification needed.
    if (path === "new" && knowsCaseType === true && hasManualCategoryPick) {
      setPredictedCategory(mapPracticeAreaToCategory(selectedPracticeArea));
      setStep("assign");
      return;
    }

    const analysisText = path === "new" ? description.trim() : "";
    if (analysisText) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setPredictedCategory(predictCategory(analysisText));
        setIsAnalyzing(false);
        setStep("assign");
      }, 900);
    } else {
      setPredictedCategory(null);
      setStep("assign");
    }
  }

  async function handlePay() {
    setIsPaying(true);

    const readEntry = async (f: File, id: string, today: string): Promise<CaseDocument> => {
      const fileDataUrl = f.size <= MAX_ATTACHMENT_BYTES ? await readFileAsDataUrl(f) : undefined;
      return {
        id,
        name: f.name,
        size: fmtSize(f.size),
        uploadedAt: today,
        fileDataUrl,
        fileMimeType: f.type || undefined,
        uploadedBy: "citizen",
      };
    };

    setTimeout(async () => {
      const lawyer = assignMode === "browse" ? selectedLawyer : undefined;
      const id = generateCloseUrCaseId();
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      const documentEntries: CaseDocument[] = await Promise.all([
        ...images.map((f, i) => readEntry(f, `d_img_${i}`, today)),
        ...documents.map((f, i) => readEntry(f, `d_doc_${i}`, today)),
      ]);

      const title =
        path === "existing"
          ? `Existing Case — CNR ${cnr.trim()}`
          : description.trim()
            ? description.trim().slice(0, 60) + (description.trim().length > 60 ? "…" : "")
            : "New Legal Matter";

      const isExistingClosed = path === "existing" && existingCaseStatus === "Closed";

      const caseDescription =
        path === "existing"
          ? `Linked from an existing court case (currently ${existingCaseStatus.toLowerCase()} in court) using CNR number ${cnr.trim()}.`
          : description.trim() || "Submitted with attachments only.";

      const status: CaseStatus = isExistingClosed ? "Closed" : lawyer ? "Assigned" : "Submitted";

      const timeline = isExistingClosed
        ? [
            {
              id: "t1",
              status: "Closed" as CaseStatus,
              at: today,
              time,
              note: `Existing case (CNR ${cnr.trim()}) linked as already closed`,
            },
          ]
        : [
            {
              id: "t1",
              status: "Submitted" as CaseStatus,
              at: today,
              time,
              note: "Case filed via Find a Lawyer",
            },
            lawyer
              ? {
                  id: "t2",
                  status: "Assigned" as CaseStatus,
                  at: today,
                  time,
                  note: `Assigned to ${lawyer.name}`,
                }
              : {
                  id: "t2",
                  status: "Submitted" as CaseStatus,
                  at: today,
                  time,
                  note: "Auto-assign requested — pending admin allocation",
                },
          ];

      const newCase: LegalCase = {
        id,
        title,
        description: caseDescription,
        category: predictedCategory ?? "Civil",
        citizenId: CITIZEN_ID,
        citizenName: clientName.trim() || CITIZEN_NAME,
        citizenName: clientName.trim() || CITIZEN_NAME,
        lawyerId: lawyer?.id,
        lawyerName: lawyer?.name,
        status,
        city: CITIZEN_CITY,
        createdAt: today,
        updatedAt: today,
        timeline,
        source: "manual",
        caseDetails: {
          courtName: "Not yet determined",
          cnr: path === "existing" ? cnr.trim() : undefined,
          historyOfCaseHearings: [],
          interimOrders: [],
          judges: [],
          petitioners: [],
          petitionerAdvocates: [],
          respondents: [],
          respondentAdvocates: [],
          hasOrders: false,
          hasJudgments: false,
          orderCount: 0,
          interimOrderCount: 0,
          judgmentCount: 0,
          hearingCount: 0,
          iaCount: 0,
          taggedMatters: [],
          judgmentOrders: [],
        },
        entityInfo: { dateCreated: now.toISOString(), dateModified: now.toISOString() },
        files: { files: documentEntries },
        descriptions: {
          enumFields: [
            "caseType",
            "caseStatus",
            "courtCode",
            "judicialSection",
            "caseCategory",
            "benchType",
            "stateCode",
          ],
          enumLookup: {},
        },
        caseAiAnalysis: null,
      };

      addCase(newCase);
      if (assignMode === "admin" && selectedPlan) {
        addSubscription({
          citizenId: CITIZEN_ID,
          planId: selectedPlan.id,
          planLabel: selectedPlan.label,
          amount: selectedPlan.price,
          caseId: id,
        });
      }
      setCreatedCaseId(id);
      setAssignedLawyerName(lawyer?.name || "");
      setAdminAssignRequested(assignMode === "admin");
      setIsPaying(false);
      setStep("done");
    }, 1200);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 space-y-2 px-3 pt-3 sm:px-6 sm:pt-6 md:px-10 md:pt-5">
        <PageHeader
          title="Find a Lawyer"
          description="Link an existing case or start a new one — just a few quick steps."
          actionsPosition="below"
        />
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 space-y-2 px-3 pt-3 sm:px-6 sm:pt-6 md:px-10 md:pt-5">
        <PageHeader
          title="Find a Lawyer"
          description="Link an existing case or start a new one — just a few quick steps."
          actionsPosition="below"
        />

        {/* Your progress — horizontal stepper, fixed above the scrollable step content */}
        <Card variant="elevated" className="p-2 sm:p-2.5">
          <ol className="grid grid-cols-2 gap-y-1.5 sm:flex sm:items-center sm:gap-0">
            {WIZARD_STEPS.map((s, i) => {
              const currentIndex = WIZARD_STEPS.findIndex((x) => x.key === step);
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <li key={s.key} className="flex items-center gap-2 sm:flex-1">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={`text-[11px] ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                  {i < WIZARD_STEPS.length - 1 && (
                    <span className="mx-1.5 hidden h-px flex-1 bg-border sm:block" />
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
        {/* Your progress — horizontal stepper, fixed above the scrollable step content */}
        <Card variant="elevated" className="p-2 sm:p-2.5">
          <ol className="grid grid-cols-2 gap-y-1.5 sm:flex sm:items-center sm:gap-0">
            {WIZARD_STEPS.map((s, i) => {
              const currentIndex = WIZARD_STEPS.findIndex((x) => x.key === step);
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <li key={s.key} className="flex items-center gap-2 sm:flex-1">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={`text-[11px] ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                  {i < WIZARD_STEPS.length - 1 && (
                    <span className="mx-1.5 hidden h-px flex-1 bg-border sm:block" />
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-6 sm:py-4 md:px-10 md:py-4">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-6 sm:py-4 md:px-10 md:py-4">
        {/* ── STEP 1: choose path + provide details ─────────────────────── */}
        {step === "details" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">
                  Client Name
                </span>
                <span className="ml-auto whitespace-nowrap rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  Required
                </span>
              </div>
              <TextField
                value={clientName}
                onChange={(v) => {
                  setClientName(v);
                  setClientNameTouched(true);
                }}
                placeholder="Full name of the person filing this case"
                required
                error={clientNameTouched && !hasClientName}
                className="w-full"
              />
              {clientNameTouched && !hasClientName && (
                <p className="text-[10px] font-medium text-destructive">
                  This field is required before you can continue.
                </p>
              )}
            </div>

            <div className={`grid gap-2.5 ${path === null ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              {path !== "new" && (
                <Card
                  variant="outlined"
                  onClick={() => {
                    setPath("existing");
                    setClientNameTouched(true);
                  }}
                  className={`p-3 sm:p-4 ${
                    path === "existing" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileSearch className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground flex flex-wrap justify-between items-center gap-2">
                        <span>Existing Case</span>
                        {path === "existing" && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex gap-1 rounded-lg border border-border bg-muted p-0.5">
                              <button
                                type="button"
                                onClick={() => setExistingCaseStatus("Pending")}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                                  existingCaseStatus === "Pending"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Pending
                              </button>
                              <button
                                type="button"
                                onClick={() => setExistingCaseStatus("Closed")}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                                  existingCaseStatus === "Closed"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Closed
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Already filed in court? Link it with your CNR number.
                      </p>
                    </div>
                    {path === "existing" && (
                      <button
                        type="button"
                        title="Change case type"
                        aria-label="Change case type"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPath(null);
                        }}
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">
                  Client Name
                </span>
                <span className="ml-auto whitespace-nowrap rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  Required
                </span>
              </div>
              <TextField
                value={clientName}
                onChange={(v) => {
                  setClientName(v);
                  setClientNameTouched(true);
                }}
                placeholder="Full name of the person filing this case"
                required
                error={clientNameTouched && !hasClientName}
                className="w-full"
              />
              {clientNameTouched && !hasClientName && (
                <p className="text-[10px] font-medium text-destructive">
                  This field is required before you can continue.
                </p>
              )}
            </div>

            <div className={`grid gap-2.5 ${path === null ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              {path !== "new" && (
                <Card
                  variant="outlined"
                  onClick={() => {
                    setPath("existing");
                    setClientNameTouched(true);
                  }}
                  className={`p-3 sm:p-4 ${
                    path === "existing" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileSearch className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground flex flex-wrap justify-between items-center gap-2">
                        <span>Existing Case</span>
                        {path === "existing" && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex gap-1 rounded-lg border border-border bg-muted p-0.5">
                              <button
                                type="button"
                                onClick={() => setExistingCaseStatus("Pending")}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                                  existingCaseStatus === "Pending"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Pending
                              </button>
                              <button
                                type="button"
                                onClick={() => setExistingCaseStatus("Closed")}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                                  existingCaseStatus === "Closed"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Closed
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Already filed in court? Link it with your CNR number.
                      </p>
                    </div>
                    {path === "existing" && (
                      <button
                        type="button"
                        title="Change case type"
                        aria-label="Change case type"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPath(null);
                        }}
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {path === "existing" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 space-y-1.5 border-t border-border/60 pt-3"
                    >
                      <TextField
                        label="CNR Number"
                        value={cnr}
                        onChange={setCnr}
                        placeholder="e.g. APHC010012342025"
                        autoFocus
                        className="w-full"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        We'll pull up your case and connect it with an available Lawyer.
                      </p>
                    </div>
                  )}
                </Card>
              )}
                  {path === "existing" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 space-y-1.5 border-t border-border/60 pt-3"
                    >
                      <TextField
                        label="CNR Number"
                        value={cnr}
                        onChange={setCnr}
                        placeholder="e.g. APHC010012342025"
                        autoFocus
                        className="w-full"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        We'll pull up your case and connect it with an available Lawyer.
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {path !== "existing" && (
                <Card
                  variant="outlined"
                  onClick={() => {
                    setPath("new");
                    setClientNameTouched(true);
                  }}
                  className={`p-3 sm:p-4 ${
                    path === "new" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FilePlus2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground">New Case</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Add photos, a document, a voice note, or just describe it.
                      </p>
                    </div>
                    {path === "new" && (
                      <button
                        type="button"
                        title="Change case type"
                        aria-label="Change case type"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPath(null);
                        }}
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {path === "new" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 space-y-2.5 border-t border-border/60 pt-3"
                    >
                      <TextField
                        label="Describe your issue"
                        type="textarea"
                        rows={3}
                        value={description}
                        onChange={setDescription}
                        placeholder="Tell us what happened — as much or as little detail as you like."
                        className="w-full"
                      />
              {path !== "existing" && (
                <Card
                  variant="outlined"
                  onClick={() => {
                    setPath("new");
                    setClientNameTouched(true);
                  }}
                  className={`p-3 sm:p-4 ${
                    path === "new" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FilePlus2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground">New Case</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Add photos, a document, a voice note, or just describe it.
                      </p>
                    </div>
                    {path === "new" && (
                      <button
                        type="button"
                        title="Change case type"
                        aria-label="Change case type"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPath(null);
                        }}
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {path === "new" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 space-y-2.5 border-t border-border/60 pt-3"
                    >
                      <TextField
                        label="Describe your issue"
                        type="textarea"
                        rows={3}
                        value={description}
                        onChange={setDescription}
                        placeholder="Tell us what happened — as much or as little detail as you like."
                        className="w-full"
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outlined"
                          icon={<ImageIcon className="h-3.5 w-3.5" />}
                          onClick={() => imageInputRef.current?.click()}
                          className="!h-8 !px-3 !text-xs"
                        >
                          Add Photos
                        </Button>
                        <Button
                          variant="outlined"
                          icon={<Paperclip className="h-3.5 w-3.5" />}
                          onClick={() => docInputRef.current?.click()}
                          className="!h-8 !px-3 !text-xs"
                        >
                          Add Document
                        </Button>
                        <Button
                          variant={isRecording ? "filled" : "outlined"}
                          icon={
                            isRecording ? (
                              <Square className="h-3 w-3 fill-current" />
                            ) : (
                              <Mic className="h-3.5 w-3.5" />
                            )
                          }
                          onClick={handleRecordVoiceNote}
                          className="!h-8 !px-3 !text-xs"
                        >
                          {isRecording ? "Tap to stop…" : "Voice Note"}
                        </Button>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const sel = Array.from(e.target.files ?? []);
                            setImages((prev) => [...prev, ...sel]);
                            e.target.value = "";
                          }}
                        />
                        <input
                          ref={docInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const sel = Array.from(e.target.files ?? []);
                            setDocuments((prev) => [...prev, ...sel]);
                            e.target.value = "";
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outlined"
                          icon={<ImageIcon className="h-3.5 w-3.5" />}
                          onClick={() => imageInputRef.current?.click()}
                          className="!h-8 !px-3 !text-xs"
                        >
                          Add Photos
                        </Button>
                        <Button
                          variant="outlined"
                          icon={<Paperclip className="h-3.5 w-3.5" />}
                          onClick={() => docInputRef.current?.click()}
                          className="!h-8 !px-3 !text-xs"
                        >
                          Add Document
                        </Button>
                        <Button
                          variant={isRecording ? "filled" : "outlined"}
                          icon={
                            isRecording ? (
                              <Square className="h-3 w-3 fill-current" />
                            ) : (
                              <Mic className="h-3.5 w-3.5" />
                            )
                          }
                          onClick={handleRecordVoiceNote}
                          className="!h-8 !px-3 !text-xs"
                        >
                          {isRecording ? "Tap to stop…" : "Voice Note"}
                        </Button>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const sel = Array.from(e.target.files ?? []);
                            setImages((prev) => [...prev, ...sel]);
                            e.target.value = "";
                          }}
                        />
                        <input
                          ref={docInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const sel = Array.from(e.target.files ?? []);
                            setDocuments((prev) => [...prev, ...sel]);
                            e.target.value = "";
                          }}
                        />
                      </div>

                      {voiceError && <p className="text-[11px] text-destructive">{voiceError}</p>}
                      {isRecording && (
                        <p className="text-[11px] text-muted-foreground">
                          Listening… speak now, then tap the button again to stop.
                        </p>
                      )}
                      {voiceError && <p className="text-[11px] text-destructive">{voiceError}</p>}
                      {isRecording && (
                        <p className="text-[11px] text-muted-foreground">
                          Listening… speak now, then tap the button again to stop.
                        </p>
                      )}

                      {(images.length > 0 || documents.length > 0) && (
                        <ul className="space-y-1.5">
                          {images.map((f, i) => (
                            <AttachmentRow
                              key={`img-${i}`}
                              icon={<ImageIcon className="h-3.5 w-3.5" />}
                              label={f.name}
                              onRemove={() => setImages((prev) => prev.filter((_, x) => x !== i))}
                            />
                          ))}
                          {documents.map((f, i) => (
                            <AttachmentRow
                              key={`doc-${i}`}
                              icon={<Paperclip className="h-3.5 w-3.5" />}
                              label={f.name}
                              onRemove={() =>
                                setDocuments((prev) => prev.filter((_, x) => x !== i))
                              }
                            />
                          ))}
                        </ul>
                      )}

                      <div className="space-y-2 border-t border-border pt-3">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs font-bold text-foreground">
                            Do you know the legal category for this case?
                          </span>
                          <div className="inline-flex gap-1 rounded-lg border border-border bg-muted p-0.5 self-start">
                            <button
                              type="button"
                              onClick={() => setKnowsCaseType(true)}
                              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                knowsCaseType === true
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setKnowsCaseType(false);
                                setSelectedPracticeArea("");
                                setSelectedSpecialization("");
                                setSelectedLegalServices([]);
                              }}
                              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                knowsCaseType === false
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        {knowsCaseType === true && (
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            <Select
                              label="Practice Area"
                              required
                              value={selectedPracticeArea}
                              onChange={handlePracticeAreaChange}
                              options={[
                                { value: "", label: "-- Select Practice Area --" },
                                ...LAWYER_PRACTICE_AREAS.map((pa) => ({
                                  value: pa.category,
                                  label: pa.category,
                                })),
                              ]}
                            />
                            <Select
                              label="Specialization"
                              required
                              value={selectedSpecialization}
                              onChange={handleSpecializationChange}
                              disabled={
                                !selectedPracticeArea || availableSpecializations.length === 0
                              }
                              options={[
                                { value: "", label: "-- Select Specialization --" },
                                ...availableSpecializations.map((s) => ({
                                  value: s.case_type,
                                  label: s.case_type,
                                })),
                              ]}
                            />
                            <MultiSelectField
                              label="Legal Service"
                              options={availableLegalServices}
                              selected={selectedLegalServices}
                              onToggle={toggleLegalService}
                              disabled={
                                !selectedSpecialization || availableLegalServices.length === 0
                              }
                            />
                          </div>
                        )}

                        {knowsCaseType === false &&
                          (hasDescriptionText ? (
                            <p className="text-[11px] text-muted-foreground">
                              No problem — we'll analyze your description to identify the right
                              legal category for you.
                            </p>
                          ) : (
                            <p className="text-[11px] font-medium text-destructive">
                              Please describe your issue above in a few words — attachments alone
                              aren't enough for us to identify the legal category.
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {!canContinueDetails && missingDetailsReason && (
              <p className="text-right text-[11px] font-medium text-muted-foreground">
                {missingDetailsReason}
              </p>
            )}
            {!canContinueDetails && missingDetailsReason && (
              <p className="text-right text-[11px] font-medium text-muted-foreground">
                {missingDetailsReason}
              </p>
            )}
            <div className="flex justify-between">
              <Button
                variant="outlined"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate({ to: "/citizen" })}
              >
                Back
              </Button>
              <Button
                disabled={!canContinueDetails || isAnalyzing}
                onClick={handleContinueFromDetails}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <CircularProgress
                      indeterminate
                      ariaLabel="Analyzing case"
                      className="h-4 w-4"
                    />
                    Analyzing case…
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: assign an Lawyer ──────────────────────────────── */}
        {step === "assign" && (
          <div className="space-y-5">
            {predictedCategory && (
              <Card variant="elevated" className="p-4 sm:p-5 border-primary/30 bg-primary/5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-primary">
                      {knowsCaseType === true ? "Selected Case Category" : "AI Case Analysis"}
                      {knowsCaseType === true ? "Selected Case Category" : "AI Case Analysis"}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {knowsCaseType === true
                        ? `${predictedCategory} Law matter`
                        : `Looks like a ${predictedCategory} Law matter`}
                      {knowsCaseType === true
                        ? `${predictedCategory} Law matter`
                        : `Looks like a ${predictedCategory} Law matter`}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      We've prioritized {predictedCategory} Law Lawyers in the list below.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Card
                variant="outlined"
                onClick={() => setAssignMode("browse")}
                className={`p-4 sm:p-5 ${
                  assignMode === "browse" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">Choose an Lawyer</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Browse Lawyers near you, sorted by location.
                    </p>
                  </div>
                  {assignMode === "browse" && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </div>
              </Card>

              <Card
                variant="outlined"
                onClick={() => setAssignMode("admin")}
                className={`p-4 sm:p-5 ${
                  assignMode === "admin" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">Auto-Assign</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Send it to our admin team — they'll assign the best available Lawyer.
                    </p>
                  </div>
                  {assignMode === "admin" && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </div>
              </Card>
            </div>

            {assignMode === "browse" && (
              <Card variant="elevated" className="p-4 sm:p-6 space-y-3">
                <h2 className="text-sm font-bold text-foreground">Pick a lawyer from law hub</h2>
                <p className="text-[11px] text-muted-foreground">
                  {locating
                    ? "Detecting your location…"
                    : `Sorted by proximity to ${userCityLabel}${
                        selectedPracticeArea
                          ? ` and ${selectedSpecialization || selectedPracticeArea} expertise`
                          : predictedCategory
                            ? ` and ${predictedCategory} Law expertise`
                            : ""
                      }.`}
                </p>
                    : `Sorted by proximity to ${userCityLabel}${
                        selectedPracticeArea
                          ? ` and ${selectedSpecialization || selectedPracticeArea} expertise`
                          : predictedCategory
                            ? ` and ${predictedCategory} Law expertise`
                            : ""
                      }.`}
                </p>

                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {sortedLawyers.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
                      No Lawyers match this practice area right now — go back and try Auto-Assign
                      instead.
                      No Lawyers match this practice area right now — go back and try Auto-Assign
                      instead.
                    </p>
                  ) : (
                    sortedLawyers.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setSelectedLawyerId(l.id)}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 transition-all ${
                          selectedLawyerId === l.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar name={l.name} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-foreground">
                              {l.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {l.category} Law · {l.area ? `${l.area}, ` : ""}
                              {l.city} · {l.experienceYears} yrs
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileLawyer(l);
                            }}
                          >
                            View
                          </Button>
                          {selectedLawyerId === l.id && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {assignMode === "admin" && (
              <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  We'll send your case details to our admin team, and they'll assign the best
                  available Lawyer on your behalf. You'll be notified as soon as it's assigned.
                </p>

                <div>
                  <h3 className="mb-2 text-xs font-bold text-foreground">Choose a plan</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <Card
                        key={plan.id}
                        variant="outlined"
                        onClick={() => setSubscriptionPlan(plan.id)}
                        className={`relative p-4 ${
                          subscriptionPlan === plan.id
                            ? "border-primary ring-1 ring-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            {plan.badge}
                          </span>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-foreground">{plan.label}</div>
                            <div className="mt-1 flex items-baseline gap-0.5">
                              <IndianRupee className="h-3.5 w-3.5 text-primary" />
                              <span className="text-lg font-extrabold text-primary">
                                {plan.price}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {plan.cadence}
                              </span>
                            </div>
                          </div>
                          {subscriptionPlan === plan.id && (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                          )}
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">{plan.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                variant="outlined"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setStep("details")}
              >
                Back
              </Button>
              <Button disabled={!canContinueAssign} onClick={() => setStep("payment")}>
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: mock payment ────────────────────────────────────── */}
        {step === "payment" && (
          <Card variant="elevated" className="overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Payment</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Secure ·{" "}
                    {assignMode === "admin" && selectedPlan
                      ? `${selectedPlan.label} plan`
                      : "One-time fee"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-background divide-y divide-border/60 text-xs">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Case type</span>
                  <span className="font-medium text-foreground">
                    {path === "existing" ? "Existing Case" : "New Case"}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Lawyer</span>
                  <span className="font-medium text-foreground">
                    {assignMode === "browse" ? selectedLawyer?.name : "Assigned by admin"}
                  </span>
                </div>
                {assignMode === "admin" && selectedPlan && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium text-foreground">
                      {selectedPlan.label} ({selectedPlan.cadence.replace("/", "billed per ")})
                    </span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-primary/5">
                  <span className="font-bold text-foreground">Total</span>
                  <div className="flex items-center font-extrabold text-primary text-sm">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span>{totalFee}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>256-bit SSL encrypted · No card data stored</span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  icon={<ArrowLeft className="h-4 w-4" />}
                  disabled={isPaying}
                  onClick={() => setStep("assign")}
                >
                  Back
                </Button>
                <Button className="flex-1" disabled={isPaying} onClick={handlePay}>
                  {isPaying ? (
                    <span className="flex items-center justify-center gap-2">
                      <CircularProgress
                        indeterminate
                        ariaLabel="Processing payment"
                        className="h-4 w-4"
                      />
                      Processing…
                    </span>
                  ) : (
                    `Pay ₹${totalFee}`
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── STEP 4: done ─────────────────────────────────────────────── */}
        {step === "done" && (
          <Card variant="elevated" className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Case Submitted Successfully</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Case registered with ID <strong className="text-primary">{createdCaseId}</strong>
                {assignedLawyerName ? (
                  <>
                    {" "}
                    and assigned to{" "}
                    <strong className="text-foreground">{assignedLawyerName}</strong>.
                  </>
                ) : adminAssignRequested ? (
                  <>
                    {" "}
                    Your request has been sent to our admin team — you'll be notified once an Lawyer
                    is assigned.
                  </>
                ) : (
                  "."
                )}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button onClick={() => navigate({ to: "/citizen/my-cases" })}>My Cases</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Lawyer Profile Popup */}
      <Dialog
        open={profileLawyer !== null}
        onOpenChange={(o) => !o && setProfileLawyer(null)}
        maxWidth="680px"
      >
        {profileLawyer && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3 w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lawyer Profile
                </span>
                {/* Focus sink — absorbs md-dialog's auto-focus on open */}
                <span tabIndex={0} aria-hidden="true" className="sr-only" />
                <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setProfileLawyer(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </IconButton>
              </DialogTitle>
            </DialogHeader>
            <DialogContent>
              <LawyerProfileCard lawyer={profileLawyer} />
            </DialogContent>
          </>
        )}
      </Dialog>
    </div>
  );
}

const WIZARD_STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Case details" },
  { key: "assign", label: "Assign Lawyer" },
  { key: "payment", label: "Payment" },
  { key: "done", label: "Done" },
];

function AttachmentRow({
  icon,
  label,
  sub,
  onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2">
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground">{label}</div>
          {sub && <p className="text-[11px] text-muted-foreground line-clamp-2">{sub}</p>}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-destructive"
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/** A checkbox-driven multi-select, styled to match the m3 outlined Select
 * it sits alongside — used for "Legal Service" since @material/web's select
 * has no built-in multi-select mode. All options are passed in already
 * selected by default when a specialization is first picked. */
function MultiSelectField({
  label,
  options,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const summary =
    options.length === 0
      ? ""
      : selected.length === options.length
        ? "All services"
        : selected.length === 0
          ? "None selected"
          : `${selected.length} of ${options.length} selected`;

  return (
    <div className="relative">
      <span
        className={`absolute -top-2 left-3 z-10 bg-surface px-1 text-[11px] transition-colors ${
          disabled ? "text-muted-foreground/50" : open ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-9 w-full items-center justify-between gap-2 rounded-[4px] border px-3 text-left text-sm outline-hidden transition-colors ${
          disabled
            ? "cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground/50"
            : open
              ? "cursor-pointer border-primary bg-background text-foreground ring-1 ring-primary"
              : "cursor-pointer border-border bg-background text-foreground hover:border-foreground/60"
        }`}
      >
        <span className="block min-w-0 flex-1 truncate">{summary || "—"}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-1 max-h-56 w-full min-w-60 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
            {options.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs hover:bg-muted/60"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors ${
                      isChecked
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/50 bg-transparent"
                    }`}
                  >
                    {isChecked && (
                      <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                    )}
                  </span>
                  <span className="text-foreground">{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** A checkbox-driven multi-select, styled to match the m3 outlined Select
 * it sits alongside — used for "Legal Service" since @material/web's select
 * has no built-in multi-select mode. All options are passed in already
 * selected by default when a specialization is first picked. */
function MultiSelectField({
  label,
  options,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const summary =
    options.length === 0
      ? ""
      : selected.length === options.length
        ? "All services"
        : selected.length === 0
          ? "None selected"
          : `${selected.length} of ${options.length} selected`;

  return (
    <div className="relative">
      <span
        className={`absolute -top-2 left-3 z-10 bg-surface px-1 text-[11px] transition-colors ${
          disabled ? "text-muted-foreground/50" : open ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-9 w-full items-center justify-between gap-2 rounded-[4px] border px-3 text-left text-sm outline-hidden transition-colors ${
          disabled
            ? "cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground/50"
            : open
              ? "cursor-pointer border-primary bg-background text-foreground ring-1 ring-primary"
              : "cursor-pointer border-border bg-background text-foreground hover:border-foreground/60"
        }`}
      >
        <span className="block min-w-0 flex-1 truncate">{summary || "—"}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-1 max-h-56 w-full min-w-60 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
            {options.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs hover:bg-muted/60"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors ${
                      isChecked
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/50 bg-transparent"
                    }`}
                  >
                    {isChecked && (
                      <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                    )}
                  </span>
                  <span className="text-foreground">{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
