import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Briefcase,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FormStepper } from "@/components/app/FormStepper";
import type { FormStep } from "@/components/app/FormStepper";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { LAWYER_PRACTICE_AREAS } from "@/components/app/lawyerPracticeAreas";
import { sanitizeName, sanitizePhone, validateName, validatePhone, validateEmail } from "@/lib/validations";
import { INDIAN_COURTS, INDIAN_CITIES, INDIAN_LANGUAGES } from "@/data/courts";
import { addLawyer } from "@/data/appStore";
import { readFileAsDataUrl } from "@/lib/files";
import type { LegalCategory, LawyerAward, LawyerPracticeArea } from "@/types";
import { Button, IconButton, TextField, Select, Checkbox, InputChip } from "@/components/m3";

const MAX_ID_PROOF_BYTES = 5 * 1024 * 1024;

interface SelectedPracticeEntry {
  id: string;
  practiceArea: string;
  specialization: string;
  legalService: string;
}

// Map practice area names to core LegalCategory types
function mapPracticeAreaToCategory(areaName: string): LegalCategory {
  const lower = areaName.toLowerCase();
  if (lower.includes("criminal")) return "Criminal";
  if (lower.includes("corporate")) return "Corporate";
  if (lower.includes("family")) return "Family";
  if (lower.includes("property")) return "Property";
  if (lower.includes("consumer")) return "Consumer";
  if (lower.includes("cyber")) return "Cyber";
  if (lower.includes("labour")) return "Labour";
  if (lower.includes("banking") || lower.includes("tax") || lower.includes("civil")) return "Civil";
  return "Civil";
}

export const Route = createFileRoute("/lawyer-register")({
  head: () => ({ meta: [{ title: "Lawyer registration — CloseUrCase" }] }),
  component: LawyerRegister,
});

/** Desktop wizard steps. Mobile ignores these and renders the form as one
 * continuous scroll, so the grouping only ever affects `lg:` and up. */
const REGISTER_STEPS: FormStep[] = [
  { id: 1, label: "Your details" },
  { id: 2, label: "Practice areas" },
  { id: 3, label: "Contact & credentials" },
  { id: 4, label: "Verification" },
];

/** Shows its children only when `n` is the active step — but only on desktop.
 * Below `lg` every step renders, preserving the existing single-scroll form. */
function Step({ n, current, children }: { n: number; current: number; children: ReactNode }) {
  return (
    <div
      className={cn(
        "w-full min-w-0 space-y-3 lg:space-y-2.5",
        n === current
          ? "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:pr-1.5"
          : "lg:hidden",
      )}
    >
      {children}
    </div>
  );
}

function LawyerRegister() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  // Desktop wizard position. `furthestStep` keeps already-visited steps
  // clickable in the stepper without letting users skip ahead.
  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const goToStep = (id: number) => setStep(id);
  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () =>
    setStep((s) => {
      const next = Math.min(REGISTER_STEPS.length, s + 1);
      setFurthestStep((f) => Math.max(f, next));
      return next;
    });

  // Registration type toggle
  const [registrationType, setRegistrationType] = useState<"lawyer" | "firm">("lawyer");
  const isFirm = registrationType === "firm";

  // Profile photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [barId, setBarId] = useState("");
  const [address, setAddress] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [bio, setBio] = useState("");

  const nameRes = validateName(name);
  const emailRes = validateEmail(email);
  const phoneRes = validatePhone(phone);

  // 3-Tier Practice Category Selection State
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [selectedServicesMulti, setSelectedServicesMulti] = useState<string[]>([]);

  // Selected Practice Entries list
  const [selectedPracticeEntries, setSelectedPracticeEntries] = useState<SelectedPracticeEntry[]>(
    [],
  );
  const [practiceError, setPracticeError] = useState("");

  // Available specializations for current practice area
  const availableSpecializations = useMemo(() => {
    if (!selectedPracticeArea) return [];
    const pa = LAWYER_PRACTICE_AREAS.find((p) => p.category === selectedPracticeArea);
    return pa ? pa.case_types : [];
  }, [selectedPracticeArea]);

  // Available legal services for current specialization
  const availableLegalServices = useMemo(() => {
    if (!selectedSpecialization) return [];
    const spec = availableSpecializations.find((s) => s.case_type === selectedSpecialization);
    return spec ? spec.legal_services : [];
  }, [selectedSpecialization, availableSpecializations]);

  // Handle Practice Area Selection change
  function handlePracticeAreaChange(value: string) {
    setSelectedPracticeArea(value);
    setSelectedSpecialization("");
    setSelectedServicesMulti([]);
    setPracticeError("");
  }

  // Handle Specialization Selection change
  function handleSpecializationChange(value: string) {
    setSelectedSpecialization(value);
    setPracticeError("");
    const spec = availableSpecializations.find((s) => s.case_type === value);
    if (spec && spec.legal_services) {
      setSelectedServicesMulti([...spec.legal_services]);
    } else {
      setSelectedServicesMulti([]);
    }
  }

  // Toggle multi-select service checkbox
  function toggleServiceInMulti(serviceName: string) {
    setSelectedServicesMulti((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName],
    );
  }

  // Select all or deselect all services for active specialization
  function selectAllServicesInSpec() {
    if (selectedServicesMulti.length === availableLegalServices.length) {
      setSelectedServicesMulti([]);
    } else {
      setSelectedServicesMulti([...availableLegalServices]);
    }
  }

  // Add selected practice area + specialization + service(s)
  function handleAddPracticeEntries() {
    setPracticeError("");
    if (!selectedPracticeArea) {
      setPracticeError("Please select a Practice Area.");
      return;
    }
    if (!selectedSpecialization) {
      setPracticeError("Please select a Specialization.");
      return;
    }

    const servicesToAdd =
      selectedServicesMulti.length > 0
        ? selectedServicesMulti
        : availableLegalServices.length > 0
          ? [availableLegalServices[0]]
          : ["General Practice"];

    setSelectedPracticeEntries((prev) => {
      const next = [...prev];
      for (const s of servicesToAdd) {
        const exists = next.some(
          (e) =>
            e.practiceArea === selectedPracticeArea &&
            e.specialization === selectedSpecialization &&
            e.legalService === s,
        );
        if (!exists) {
          next.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${s}`,
            practiceArea: selectedPracticeArea,
            specialization: selectedSpecialization,
            legalService: s,
          });
        }
      }
      return next;
    });

    // Reset selection after adding
    setSelectedPracticeArea("");
    setSelectedSpecialization("");
    setSelectedServicesMulti([]);
  }

  // Remove a practice entry
  function removePracticeEntry(id: string) {
    setSelectedPracticeEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // Clear all practice entries
  function clearAllPracticeEntries() {
    setSelectedPracticeEntries([]);
  }

  const [languages, setLanguages] = useState<string[]>([]);
  const [courts, setCourts] = useState<string[]>([]);
  const [awards, setAwards] = useState<LawyerAward[]>([]);
  const [awardTitle, setAwardTitle] = useState("");
  const [awardYear, setAwardYear] = useState("");

  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofError, setIdProofError] = useState("");
  const idProofInputRef = useRef<HTMLInputElement>(null);

  function handleIdProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ID_PROOF_BYTES) {
      setIdProofError("File must be under 5MB.");
      return;
    }
    setIdProofError("");
    setIdProofFile(file);
  }

  function addAward() {
    const t = awardTitle.trim();
    if (!t) return;
    setAwards((prev) => [...prev, { title: t, year: awardYear.trim() || new Date().getFullYear().toString() }]);
    setAwardTitle("");
    setAwardYear("");
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setEmailTouched(true);
    setPhoneTouched(true);

    if (!nameRes.isValid) {
      setStep(1);
      return;
    }
    if (!emailRes.isValid || !phoneRes.isValid) {
      setStep(3);
      return;
    }
    const primaryPractice = selectedPracticeEntries[0]?.practiceArea || "Civil Law";
    const category = mapPracticeAreaToCategory(primaryPractice);
    const specializations = Array.from(
      new Set(selectedPracticeEntries.map((pe) => pe.specialization)),
    );
    const legalServices = Array.from(
      new Set(selectedPracticeEntries.map((pe) => pe.legalService)),
    );
    const practiceAreas = Array.from(
      new Set(selectedPracticeEntries.map((pe) => pe.practiceArea)),
    );
    const photoUrl = photoPreview || undefined;
    const idProofUrl = idProofFile ? URL.createObjectURL(idProofFile) : undefined;

    addLawyer({
      name: name.trim() || (isFirm ? "Law Firm" : "Lawyer"),
      roleTitle: isFirm ? "Law Firm / Organisation" : "Advocate",
      email: email.trim() || "lawyer@CloseUrCase.app",
      phone: phone.trim() || "+91 98100 12345",
      barId: barId.trim() || "BAR/2026/001",
      city: cities[0] || "Hyderabad",
      cities: cities.length ? cities : undefined,
      category,
      experienceYears,
      status: "Pending",
      photoUrl,
      officeAddress: address.trim() || undefined,
      bio: bio.trim() || undefined,
      languages: languages.length ? languages : undefined,
      specializations: specializations.length ? specializations : undefined,
      legalServices: legalServices.length ? legalServices : undefined,
      courts: courts.length ? courts : undefined,
      practiceAreas: practiceAreas.length ? practiceAreas.map((name, i) => ({ name, proficiency: Math.max(60, 95 - i * 5) })) : undefined,
      awards: awards.length ? awards : undefined,
      idProofUrl,
      idProofFileName: idProofFile?.name,
    });
    setSubmitted(true);
  };

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} image="/lawyer-login.png" />;
  }

  if (submitted) {
    return (
      <AuthLayout
        wide
        title="Registration submitted"
        subtitle="Your application is pending administrator verification."
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thank you, <strong className="text-foreground">{name}</strong>. Your profile with Bar ID{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-bold text-primary">{barId}</code>{" "}
            has been submitted to the Super Admin for verification.
          </p>
          <div
            className="rounded-xl p-3 text-xs leading-relaxed"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-warning) 8%, transparent)",
              color: "var(--md-extended-color-on-warning-container)",
            }}
          >
            <strong>Note:</strong> You can log in and explore the Lawyer Workspace while
            verification is underway.
          </div>
          <Button variant="outlined" onClick={() => navigate({ to: "/login" })} className="w-full">
            Back to Sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      wide
      fitDesktop
      title={isFirm ? "Law Firm Registration" : "Lawyer Registration"}
      subtitle="Register your credentials and select your multi-tier practice categories to get matched with clients."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="cuc-auth-form flex w-full min-w-0 flex-col space-y-3 lg:h-full lg:min-h-0 lg:flex-1"
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const target = e.target as HTMLElement;
          if (target.closest("textarea")) return;
          const form = target.closest("form");
          if (!form) return;
          e.preventDefault();
          form.requestSubmit();
        }}
        onSubmit={handleSubmit}
      >
        {/* Desktop Stepper */}
        <div className="hidden lg:block lg:shrink-0">
          <FormStepper
            steps={REGISTER_STEPS}
            current={step}
            furthest={furthestStep}
            onStepClick={goToStep}
          />
        </div>

        <Step n={1} current={step}>
          {/* Registration Type Toggle */}
          <div className="flex w-full min-w-0 items-center justify-center">
            <div className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1 *:min-w-0">
              <Button
                type="button"
                id="toggle-lawyer"
                variant={!isFirm ? "filled" : "text"}
                icon={<User className="h-3.5 w-3.5" />}
                onClick={() => setRegistrationType("lawyer")}
                className={cn("w-full", !isFirm ? "shadow-sm" : "text-muted-foreground")}
              >
                Individual Lawyer
              </Button>
              <Button
                type="button"
                id="toggle-firm"
                variant={isFirm ? "filled" : "text"}
                icon={<Building2 className="h-3.5 w-3.5" />}
                onClick={() => setRegistrationType("firm")}
                className={cn("w-full", isFirm ? "shadow-sm" : "text-muted-foreground")}
              >
                Law Firm / Organisation
              </Button>
            </div>
          </div>

          {/* Photo / Logo Upload */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5">
            <button
              type="button"
              id="photo-upload-btn"
              onClick={() => photoInputRef.current?.click()}
              className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-primary/5 transition-all hover:border-primary hover:bg-primary/10"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-4 w-4 text-primary/60 transition-colors group-hover:text-primary" />
              )}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--md-sys-color-scrim) 30%, transparent)",
                }}
              >
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground">
                {isFirm ? "Organisation Logo" : "Lawyer Photo"}{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                JPG or PNG. Click the circle to upload.
              </p>
              {photoFile && (
                <Button
                  type="button"
                  variant="text"
                  icon={<X className="h-3 w-3" />}
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="h-auto! min-h-0! px-0! text-[11px]"
                >
                  Remove photo
                </Button>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <TextField
              label={isFirm ? "Organisation Name" : "Full name (Letters Only)"}
              required
              value={name}
              onChange={(v) => {
                setName(sanitizeName(v));
                setNameTouched(true);
              }}
              placeholder={isFirm ? "M/s. Reddy & Associates" : "Adv. Swathi Reddy"}
              error={nameTouched && !nameRes.isValid}
              className="w-full"
            />
            {nameTouched && !nameRes.isValid && (
              <p className="text-[11px] font-medium text-destructive">{nameRes.error}</p>
            )}
          </div>

          {/* Service Cities */}
          <TagDropdownField
            label="Service Cities *"
            placeholder="-- Select City to Add --"
            options={INDIAN_CITIES}
            values={cities}
            onAdd={(val) => {
              if (val && !cities.includes(val)) {
                setCities((prev) => [...prev, val]);
              }
            }}
            onRemove={(i) => setCities((prev) => prev.filter((_, idx) => idx !== i))}
          />
        </Step>

        <Step n={2} current={step}>
          <div className="grid grid-cols-1 gap-2.5">
            {/* Dropdown 1: Practice Area */}
            <Select
              label="Practice Area"
              value={selectedPracticeArea}
              onChange={handlePracticeAreaChange}
              options={[
                { value: "", label: "-- Select Practice Area --" },
                ...LAWYER_PRACTICE_AREAS.map((pa) => ({
                  value: pa.category,
                  label: pa.category,
                })),
              ]}
              className="w-full"
            />

            {/* Dropdown 2: Specialization */}
            <Select
              label="Specialization"
              value={selectedSpecialization}
              onChange={handleSpecializationChange}
              disabled={!selectedPracticeArea || availableSpecializations.length === 0}
              options={[
                { value: "", label: "-- Select Specialization --" },
                ...availableSpecializations.map((spec) => ({
                  value: spec.case_type,
                  label: spec.case_type,
                })),
              ]}
              className="w-full"
            />

            {/* Multi-Select Legal Services Inline Box */}
            {selectedSpecialization && availableLegalServices.length > 0 && (
              <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Legal Services ({availableLegalServices.length})
                  </span>
                  <Button
                    type="button"
                    variant="text"
                    onClick={selectAllServicesInSpec}
                    className="h-auto! min-h-0! px-0! text-[10px] text-primary hover:underline"
                  >
                    {selectedServicesMulti.length === availableLegalServices.length
                      ? "Deselect all"
                      : "Select all"}
                  </Button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {availableLegalServices.map((service) => {
                    const isChecked = selectedServicesMulti.includes(service);
                    return (
                      <label
                        key={service}
                        className="flex items-center gap-2 rounded-lg p-1 text-xs text-foreground hover:bg-background/80 cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleServiceInMulti(service)}
                        />
                        <span className="flex-1 leading-snug">{service}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="filled"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleAddPracticeEntries}
              className="w-full shadow-xs"
            >
              Add to Practice Areas
            </Button>

            {practiceError && (
              <p className="text-xs font-medium text-destructive">{practiceError}</p>
            )}
          </div>

          <div>
            {/* Selected Categories Display */}
            {selectedPracticeEntries.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Selected ({selectedPracticeEntries.length})
                  </span>
                  <Button
                    type="button"
                    variant="text"
                    icon={<Trash2 className="h-3 w-3" />}
                    onClick={clearAllPracticeEntries}
                    className="h-auto! min-h-0! px-0! text-[11px]"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedPracticeEntries.map((entry) => (
                    <InputChip
                      key={entry.id}
                      label={
                        entry.legalService
                          ? `${entry.practiceArea} › ${entry.specialization} › ${entry.legalService}`
                          : `${entry.practiceArea} › ${entry.specialization}`
                      }
                      onRemove={() => removePracticeEntry(entry.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-[11px] text-muted-foreground">
                No practice categories added yet. Select area & specialization above.
              </p>
            )}
          </div>
        </Step>

        <Step n={3} current={step}>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 *:min-w-0">
            <div className="space-y-1">
              <TextField
                label="Email"
                type="email"
                required
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setEmailTouched(true);
                }}
                placeholder="swathi@law.com"
                error={emailTouched && !emailRes.isValid}
                className="w-full"
              />
              {emailTouched && !emailRes.isValid && (
                <p className="text-[11px] font-medium text-destructive">{emailRes.error}</p>
              )}
            </div>

            <div className="space-y-1">
              <TextField
                label="Phone (10 Digits)"
                type="tel"
                required
                value={phone}
                onChange={(v) => {
                  setPhone(sanitizePhone(v));
                  setPhoneTouched(true);
                }}
                placeholder="98100 12345"
                prefixText="+91"
                maxLength={10}
                error={phoneTouched && !phoneRes.isValid}
                className="w-full"
              />
              {phoneTouched && !phoneRes.isValid && (
                <p className="text-[11px] font-medium text-destructive">{phoneRes.error}</p>
              )}
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 *:min-w-0">
            <TextField
              label="Bar Registration ID"
              required
              value={barId}
              onChange={setBarId}
              placeholder="TS/2014/1023"
              className="w-full"
            />
            <TextField
              label="Years of Experience"
              type="number"
              required
              value={String(experienceYears)}
              onChange={(v) => setExperienceYears(Math.min(50, Math.max(1, Number(v) || 1)))}
              className="w-full"
            />
          </div>

          <TextField
            label="Address"
            type="textarea"
            rows={2}
            value={address}
            onChange={setAddress}
            placeholder="Chamber No. 402, High Court Complex, Hyderabad"
            className="w-full"
          />

          <TextField
            label="Bio / About"
            type="textarea"
            rows={2}
            value={bio}
            onChange={setBio}
            placeholder="Tell clients about your practice, experience, and approach…"
            className="w-full"
          />
        </Step>

        <Step n={4} current={step}>
          <div className="grid min-w-0 grid-cols-1 gap-2.5 lg:grid-cols-2 *:min-w-0">
            <TagDropdownField
              label="Languages Spoken"
              placeholder="-- Select a Language to Add --"
              options={INDIAN_LANGUAGES}
              values={languages}
              onAdd={(val) => {
                if (val && !languages.includes(val)) {
                  setLanguages((prev) => [...prev, val]);
                }
              }}
              onRemove={(i) => setLanguages((prev) => prev.filter((_, idx) => idx !== i))}
            />

            <CourtsDropdownField
              label="Courts Practiced In"
              values={courts}
              onAdd={(val) => {
                if (val && !courts.includes(val)) {
                  setCourts((prev) => [...prev, val]);
                }
              }}
              onRemove={(i) => setCourts((prev) => prev.filter((_, idx) => idx !== i))}
            />
          </div>

          <Field label="Awards & Recognition">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <TextField
                value={awardTitle}
                onChange={setAwardTitle}
                placeholder="e.g. Client's Choice Lawyer"
                className="sm:flex-1"
              />
              <div className="flex gap-2">
                <TextField
                  value={awardYear}
                  onChange={setAwardYear}
                  placeholder="2025"
                  className="w-24"
                />
                <Button type="button" variant="outlined" onClick={addAward}>
                  Add
                </Button>
              </div>
            </div>
            {awards.length > 0 && (
              <ul className="mt-2 max-h-24 overflow-y-auto space-y-1.5 pr-1">
                {awards.map((a, i) => (
                  <li
                    key={`${a.title}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs"
                  >
                    <span className="font-semibold text-foreground">
                      {a.title}{" "}
                      <span className="font-normal text-muted-foreground">({a.year})</span>
                    </span>
                    <IconButton
                      onClick={() => setAwards((prev) => prev.filter((_, x) => x !== i))}
                      ariaLabel={`Remove ${a.title}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          <Field label="ID Proof Document">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outlined"
                icon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => idProofInputRef.current?.click()}
              >
                Choose File
              </Button>
              {idProofFile ? (
                <span className="flex min-w-0 items-center gap-1.5 text-xs text-foreground">
                  <span className="truncate font-medium">{idProofFile.name}</span>
                  <IconButton onClick={() => setIdProofFile(null)} ariaLabel="Remove ID proof">
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No file chosen</span>
              )}
            </div>
            <input
              ref={idProofInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleIdProofChange}
            />
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              Aadhaar, Bar ID, or PAN — JPG, PNG or PDF, up to 5MB.
            </p>
            {idProofError && (
              <p className="mt-1 text-[11px] font-medium text-destructive">{idProofError}</p>
            )}
          </Field>
        </Step>

        {/* Wizard Footer Navigation */}
        <div className="hidden items-center justify-between gap-3 border-t border-border pt-3 lg:mt-auto lg:flex lg:shrink-0">
          <Button
            type="button"
            variant="outlined"
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={goBack}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < REGISTER_STEPS.length ? (
            <Button
              type="button"
              variant="filled"
              icon={<ChevronRight className="h-4 w-4" />}
              onClick={goNext}
            >
              Continue
            </Button>
          ) : (
            <Button type="submit" variant="filled" className="shadow-md">
              Submit for Verification
            </Button>
          )}
        </div>

        <Button type="submit" variant="filled" className="w-full shadow-md lg:hidden">
          Submit for Verification
        </Button>
      </form>
    </AuthLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function TagDropdownField({
  label,
  placeholder,
  options,
  values,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  options: string[];
  values: string[];
  onAdd: (val: string) => void;
  onRemove: (index: number) => void;
}) {
  const [selectedVal, setSelectedVal] = useState("");
  const availableOptions = useMemo(() => {
    return options.filter((opt) => !values.includes(opt));
  }, [options, values]);

  const handleSelect = (val: string) => {
    if (!val) return;
    onAdd(val);
    setSelectedVal("");
  };

  return (
    <div>
      <Select
        label={label}
        value={selectedVal}
        onChange={handleSelect}
        options={availableOptions.map((opt) => ({ value: opt, label: opt }))}
        supportingText={placeholder}
        className="w-full"
      />
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {values.map((v, i) => (
            <InputChip key={`${v}-${i}`} label={v} onRemove={() => onRemove(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourtsDropdownField({
  label,
  values,
  onAdd,
  onRemove,
}: {
  label: string;
  values: string[];
  onAdd: (val: string) => void;
  onRemove: (index: number) => void;
}) {
  const [selectedCourt, setSelectedCourt] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const filteredCourts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return INDIAN_COURTS.filter(
      (c) => !values.includes(c) && (q ? c.toLowerCase().includes(q) : true),
    );
  }, [searchFilter, values]);

  const handleAddCourt = (courtName: string) => {
    if (!courtName) return;
    onAdd(courtName);
    setSelectedCourt("");
  };

  return (
    <div>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <TextField
            label={label}
            value={searchFilter}
            onChange={setSearchFilter}
            placeholder="Search courts…"
            className="flex-1"
          />
          {searchFilter && (
            <Button type="button" variant="outlined" onClick={() => setSearchFilter("")}>
              Clear
            </Button>
          )}
        </div>

        <Select
          label="Select court to add"
          value={selectedCourt}
          onChange={(val) => {
            setSelectedCourt(val);
            if (val) handleAddCourt(val);
          }}
          options={filteredCourts.map((c) => ({ value: c, label: c }))}
          supportingText={
            filteredCourts.length === 0
              ? "No matching courts found"
              : `${filteredCourts.length} courts available`
          }
          className="w-full"
        />
      </div>

      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {values.map((v, i) => (
            <InputChip
              key={`${v}-${i}`}
              label={v}
              icon={<Scale className="h-3 w-3" />}
              onRemove={() => onRemove(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
