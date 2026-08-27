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
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { UserAvatar } from "@/components/app/UserAvatar";
import { LawyerProfileCard } from "@/components/app/LawyerProfileCard";
import { addCase, getLawyers } from "@/data/appStore";
import { addSubmittedCase } from "@/data/caseStore";
import { generateMockTranscript } from "@/features/citizen/voiceMock";
import { distanceToCity } from "@/lib/geo";
import { useUserLocation } from "@/lib/useUserLocation";
import { MAX_ATTACHMENT_BYTES, readFileAsDataUrl } from "@/lib/files";
import type { CaseDocument, CaseStatus, LegalCase, LegalCategory, Lawyer } from "@/types";
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
  head: () => ({ meta: [{ title: "Find a Lawyer — CloseurCase" }] }),
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

  // Existing case
  const [cnr, setCnr] = useState("");

  // New case
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // AI category analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictedCategory, setPredictedCategory] = useState<LegalCategory | null>(null);

  // Assign lawyer
  const [assignMode, setAssignMode] = useState<AssignMode>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState("");
  const [profileLawyer, setProfileLawyer] = useState<Lawyer | null>(null);

  const [isPaying, setIsPaying] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState("");
  const [assignedLawyerName, setAssignedLawyerName] = useState("");
  const [adminAssignRequested, setAdminAssignRequested] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const hasNewCaseContent =
    description.trim().length > 0 || images.length > 0 || documents.length > 0;

  const canContinueDetails =
    path === "existing" ? cnr.trim().length > 0 : path === "new" ? hasNewCaseContent : false;

  const canContinueAssign =
    assignMode === "admin" || (assignMode === "browse" && selectedLawyerId !== "");

  const [cityFilter, setCityFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");

  function handleCityFilterChange(v: string) {
    setCityFilter(v);
    setAreaFilter("All");
  }

  const approvedLawyers = useMemo(() => getLawyers().filter((l) => l.status === "Approved"), []);

  const cityOptions = useMemo(
    () => Array.from(new Set(approvedLawyers.map((l) => l.city))).sort(),
    [approvedLawyers],
  );

  const areaOptions = useMemo(
    () =>
      Array.from(
        new Set(
          approvedLawyers
            .filter((l) => cityFilter === "All" || l.city === cityFilter)
            .map((l) => l.area)
            .filter((a): a is string => Boolean(a)),
        ),
      ).sort(),
    [approvedLawyers, cityFilter],
  );

  const sortedLawyers = useMemo(() => {
    // Unrecognized city names (free-text on lawyer self-registration) sort last
    // rather than being guessed at.
    const distance = (city: string) =>
      distanceToCity(userCoords.lat, userCoords.lng, city) ?? Number.MAX_SAFE_INTEGER;
    return approvedLawyers
      .filter((l) => cityFilter === "All" || l.city === cityFilter)
      .filter((l) => areaFilter === "All" || l.area === areaFilter)
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
  }, [approvedLawyers, predictedCategory, userCoords, cityFilter, areaFilter]);

  const selectedLawyer: Lawyer | undefined = sortedLawyers.find((l) => l.id === selectedLawyerId);

  function handleRecordVoiceNote() {
    if (isRecording) return;
    setIsRecording(true);
    setTimeout(() => {
      const transcript = generateMockTranscript();
      setDescription((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
      setIsRecording(false);
    }, 1400);
  }

  function handleContinueFromDetails() {
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
      const id = `CS-${Math.floor(10000 + Math.random() * 90000)}`;
      const today = new Date().toISOString().split("T")[0];

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

      const caseDescription =
        path === "existing"
          ? `Linked from an existing court case using CNR number ${cnr.trim()}.`
          : description.trim() || "Submitted with attachments only.";

      const newCase: LegalCase = {
        id,
        title,
        description: caseDescription,
        category: predictedCategory ?? "Civil",
        citizenId: CITIZEN_ID,
        citizenName: CITIZEN_NAME,
        lawyerId: lawyer?.id,
        lawyerName: lawyer?.name,
        status: (lawyer ? "Assigned" : "Submitted") as CaseStatus,
        city: CITIZEN_CITY,
        createdAt: today,
        updatedAt: today,
        documents: documentEntries,
        timeline: [
          {
            id: "t1",
            status: "Submitted" as CaseStatus,
            at: today,
            note: "Case filed via Find a Lawyer",
          },
          lawyer
            ? {
                id: "t2",
                status: "Assigned" as CaseStatus,
                at: today,
                note: `Assigned to ${lawyer.name}`,
              }
            : {
                id: "t2",
                status: "Submitted" as CaseStatus,
                at: today,
                note: "Auto-assign requested — pending admin allocation",
              },
        ],
        hearings: [],
        source: "manual",
        ...(path === "existing" ? { cnrNumber: cnr.trim() } : {}),
      };

      addCase(newCase);
      addSubmittedCase(newCase);
      setCreatedCaseId(id);
      setAssignedLawyerName(lawyer?.name || "");
      setAdminAssignRequested(assignMode === "admin");
      setIsPaying(false);
      setStep("done");
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find a Lawyer"
        description="Link an existing case or start a new one — just a few quick steps."
        actionsPosition="below"
      />

      {/* How it works — trust card, shown above the flow on every step and every breakpoint */}
      <Card variant="elevated" className="p-4 sm:p-6">
        <h2 className="text-sm font-bold text-foreground">How it works</h2>
        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-3">
          <div className="flex gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-xs text-muted-foreground">
              Every Lawyer is verified against their Bar Council registration.
            </span>
          </div>
          <div className="flex gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-xs text-muted-foreground">
              Our AI reads your description and photos to flag the right legal category
              automatically.
            </span>
          </div>
          <div className="flex gap-2.5">
            <Users className="h-4 w-4 shrink-0 text-primary" />
            <span className="text-xs text-muted-foreground">
              Get matched with an Lawyer near you, or let our admin team assign one for you.
            </span>
          </div>
        </div>
      </Card>

      {/* Your progress — horizontal stepper, shown above the flow on every step and every breakpoint */}
      <Card variant="elevated" className="p-4 sm:p-6">
        <h2 className="text-sm font-bold text-foreground">Your progress</h2>
        <ol className="mt-4 grid grid-cols-2 gap-y-4 sm:flex sm:items-center sm:gap-0">
          {WIZARD_STEPS.map((s, i) => {
            const currentIndex = WIZARD_STEPS.findIndex((x) => x.key === step);
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <li key={s.key} className="flex items-center gap-2.5 sm:flex-1">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={`text-xs ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {s.label}
                </span>
                {i < WIZARD_STEPS.length - 1 && (
                  <span className="mx-2 hidden h-px flex-1 bg-border sm:block" />
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      <div>
        {/* ── STEP 1: choose path + provide details ─────────────────────── */}
        {step === "details" && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card
                variant="outlined"
                onClick={() => setPath("existing")}
                className={`p-4 sm:p-5 ${
                  path === "existing" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileSearch className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">Existing Case</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Already filed in court? Link it with your CNR number.
                    </p>
                  </div>
                  {path === "existing" && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </div>
              </Card>

              <Card
                variant="outlined"
                onClick={() => setPath("new")}
                className={`p-4 sm:p-5 ${
                  path === "new" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FilePlus2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-foreground">New Case</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Add photos, a document, a voice note, or just describe it.
                    </p>
                  </div>
                  {path === "new" && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                </div>
              </Card>
            </div>

            {path === "existing" && (
              <Card variant="elevated" className="p-4 sm:p-6 space-y-3">
                <TextField
                  label="CNR Number"
                  value={cnr}
                  onChange={setCnr}
                  placeholder="e.g. APHC010012342025"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  We'll pull up your case and connect it with an available Lawyer.
                </p>
              </Card>
            )}

            {path === "new" && (
              <Card variant="elevated" className="p-4 sm:p-6 space-y-4">
                <TextField
                  label="Describe your issue"
                  type="textarea"
                  rows={4}
                  value={description}
                  onChange={setDescription}
                  placeholder="Tell us what happened — as much or as little detail as you like."
                  className="w-full"
                />

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <Button
                    variant="outlined"
                    icon={<ImageIcon className="h-4 w-4" />}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Add Photos
                  </Button>
                  <Button
                    variant="outlined"
                    icon={<Paperclip className="h-4 w-4" />}
                    onClick={() => docInputRef.current?.click()}
                  >
                    Add Document
                  </Button>
                  <Button
                    variant={isRecording ? "filled" : "outlined"}
                    icon={
                      isRecording ? (
                        <Square className="h-3.5 w-3.5 fill-current" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )
                    }
                    disabled={isRecording}
                    onClick={handleRecordVoiceNote}
                  >
                    {isRecording ? "Recording…" : "Voice Note"}
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
                        onRemove={() => setDocuments((prev) => prev.filter((_, x) => x !== i))}
                      />
                    ))}
                  </ul>
                )}
              </Card>
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
                    <CircularProgress indeterminate ariaLabel="Analyzing case" />
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
                      AI Case Analysis
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      Looks like a {predictedCategory} Law matter
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
                    : `Sorted by proximity to ${userCityLabel}${predictedCategory ? ` and ${predictedCategory} Law expertise` : ""}.`}
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Select
                    label="City"
                    value={cityFilter}
                    onChange={handleCityFilterChange}
                    options={[
                      { value: "All", label: "All Cities" },
                      ...cityOptions.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                  <Select
                    label="Area"
                    value={areaFilter}
                    onChange={setAreaFilter}
                    disabled={areaOptions.length === 0}
                    options={[
                      { value: "All", label: "All Areas" },
                      ...areaOptions.map((a) => ({ value: a, label: a })),
                    ]}
                  />
                </div>

                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {sortedLawyers.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
                      No Lawyers match this city/area — try widening your search.
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
              <Card variant="elevated" className="p-4 sm:p-6">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  We'll send your case details to our admin team, and they'll assign the best
                  available Lawyer on your behalf. You'll be notified as soon as it's assigned.
                </p>
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
                  <p className="text-[11px] text-muted-foreground">Secure · One-time fee</p>
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
                <div className="flex justify-between px-4 py-3 bg-primary/5">
                  <span className="font-bold text-foreground">Total</span>
                  <div className="flex items-center font-extrabold text-primary text-sm">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span>{FEE}</span>
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
                      <CircularProgress indeterminate ariaLabel="Processing payment" />
                      Processing…
                    </span>
                  ) : (
                    `Pay ₹${FEE}`
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
