import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Building2,
  Camera,
  Check,
  ChevronDown,
  Layers,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { LAWYER_PRACTICE_AREAS } from "@/components/app/lawyerPracticeAreas";
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

function LawyerRegister() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

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
  const [cities, setCities] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [barId, setBarId] = useState("");
  const [address, setAddress] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [bio, setBio] = useState("");

  // 3-Tier Practice Category Selection State (No default selection)
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedServicesMulti, setSelectedServicesMulti] = useState<string[]>([]);
  const [isMultiServiceDropdownOpen, setIsMultiServiceDropdownOpen] = useState(false);

  // Selected Practice Entries list - starts empty so lawyer selects their own
  const [selectedPracticeEntries, setSelectedPracticeEntries] = useState<SelectedPracticeEntry[]>(
    [],
  );
  const [practiceError, setPracticeError] = useState("");

  // Available specializations for current practice area
  const currentPracticeAreaObj = useMemo(() => {
    if (!selectedPracticeArea) return undefined;
    return LAWYER_PRACTICE_AREAS.find((pa) => pa.name === selectedPracticeArea);
  }, [selectedPracticeArea]);

  const availableSpecializations = useMemo(() => {
    return currentPracticeAreaObj?.specializations ?? [];
  }, [currentPracticeAreaObj]);

  // Available legal services for current specialization
  const currentSpecializationObj = useMemo(() => {
    if (!selectedSpecialization) return undefined;
    return availableSpecializations.find((s) => s.name === selectedSpecialization);
  }, [availableSpecializations, selectedSpecialization]);

  const availableLegalServices = useMemo(() => {
    return currentSpecializationObj?.legalServices ?? [];
  }, [currentSpecializationObj]);

  // Handle Practice Area change
  function handlePracticeAreaChange(newArea: string) {
    setSelectedPracticeArea(newArea);
    setSelectedSpecialization("");
    setSelectedService("");
    setSelectedServicesMulti([]);
    setIsMultiServiceDropdownOpen(false);
  }

  // Handle Specialization change
  function handleSpecializationChange(newSpec: string) {
    setSelectedSpecialization(newSpec);
    setSelectedService("");
    setSelectedServicesMulti([]);
    setIsMultiServiceDropdownOpen(false);
  }

  // Toggle multi-select service checkbox
  function toggleServiceInMulti(serviceName: string) {
    setSelectedServicesMulti((prev) =>
      prev.includes(serviceName) ? prev.filter((s) => s !== serviceName) : [...prev, serviceName],
    );
  }

  // Select all services in current specialization
  function selectAllServicesInSpec() {
    if (!availableLegalServices.length) return;
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
        : selectedService
          ? [selectedService]
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

    setSelectedServicesMulti([]);
    setSelectedService("");
    setIsMultiServiceDropdownOpen(false);
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

  function addTag(
    value: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: (v: string) => void,
  ) {
    const v = value.trim();
    if (!v) return;
    setList((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setInput("");
  }

  function removeTag(index: number, setList: React.Dispatch<React.SetStateAction<string[]>>) {
    setList((prev) => prev.filter((_, i) => i !== index));
  }

  function addAward() {
    const title = awardTitle.trim();
    const year = awardYear.trim();
    if (!title || !year) return;
    setAwards((prev) => [...prev, { title, year }]);
    setAwardTitle("");
    setAwardYear("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPracticeEntries.length === 0) {
      setPracticeError("Please add at least one Practice Category.");
      return;
    }

    const primaryArea = selectedPracticeEntries[0]?.practiceArea || selectedPracticeArea;
    const category = mapPracticeAreaToCategory(primaryArea);

    // Group practice areas with calculated proficiency
    const uniqueAreaNames = Array.from(new Set(selectedPracticeEntries.map((e) => e.practiceArea)));
    const practiceAreas: LawyerPracticeArea[] = uniqueAreaNames.map((areaName, idx) => ({
      name: areaName,
      proficiency: Math.max(60, 95 - idx * 5),
    }));

    // Specializations (2nd tier) and legal services (3rd tier) are kept as
    // separate lists — matching how the citizen "Find a Lawyer" filters
    // narrow down at each level independently.
    const specializations = Array.from(
      new Set(selectedPracticeEntries.map((e) => e.specialization).filter(Boolean)),
    );
    const legalServices = Array.from(
      new Set(
        selectedPracticeEntries
          .map((e) => (e.legalService !== "General Practice" ? e.legalService : ""))
          .filter(Boolean),
      ),
    );

    const idProofUrl = idProofFile ? await readFileAsDataUrl(idProofFile) : undefined;

    addLawyer({
      name,
      category,
      city: cities[0] || "Hyderabad",
      email,
      phone,
      barId,
      experienceYears: Number(experienceYears) || 5,
      status: "Pending",
      officeAddress: address || undefined,
      bio: bio.trim() || undefined,
      languages: languages.length ? languages : undefined,
      specializations: specializations.length ? specializations : undefined,
      legalServices: legalServices.length ? legalServices : undefined,
      courts: courts.length ? courts : undefined,
      practiceAreas: practiceAreas.length ? practiceAreas : undefined,
      awards: awards.length ? awards : undefined,
      idProofUrl,
      idProofFileName: idProofFile?.name,
    });
    setSubmitted(true);
  };

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} />;
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
            className="rounded-lg border p-3 text-xs"
            style={{
              borderColor: "var(--md-extended-color-warning-container)",
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
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* ── Registration Type Toggle ── */}
        <div className="flex items-center justify-center">
          <div className="inline-flex rounded-xl border border-border bg-muted p-1 gap-1">
            <Button
              type="button"
              id="toggle-lawyer"
              variant={!isFirm ? "filled" : "text"}
              icon={<User className="h-3.5 w-3.5" />}
              onClick={() => setRegistrationType("lawyer")}
              className={!isFirm ? "shadow-sm" : "text-muted-foreground"}
            >
              Individual Lawyer
            </Button>
            <Button
              type="button"
              id="toggle-firm"
              variant={isFirm ? "filled" : "text"}
              icon={<Building2 className="h-3.5 w-3.5" />}
              onClick={() => setRegistrationType("firm")}
              className={isFirm ? "shadow-sm" : "text-muted-foreground"}
            >
              Law Firm / Organisation
            </Button>
          </div>
        </div>

        {/* ── Photo / Logo Upload ── */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            id="photo-upload-btn"
            onClick={() => photoInputRef.current?.click()}
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-primary/5 transition-all hover:border-primary hover:bg-primary/10"
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Camera className="h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
            )}
            {/* hover overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                backgroundColor: "color-mix(in srgb, var(--md-sys-color-scrim) 30%, transparent)",
              }}
            >
              <Camera className="h-5 w-5 text-white" />
            </div>
          </button>
          <p className="text-[11px] text-muted-foreground">
            {isFirm ? "Upload Organisation Logo" : "Upload Lawyer Photo"} (optional)
          </p>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
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
              style={
                {
                  "--md-text-button-label-text-color": "var(--md-sys-color-error)",
                  "--md-text-button-with-icon-icon-color": "var(--md-sys-color-error)",
                } as React.CSSProperties
              }
            >
              Remove photo
            </Button>
          )}
        </div>

        {/* Full Name / Organisation Name */}
        <TextField
          label={isFirm ? "Organisation Name" : "Full name"}
          required
          value={name}
          onChange={setName}
          placeholder={isFirm ? "M/s. Reddy & Associates" : "Adv. Swathi Reddy"}
          className="w-full"
        />

        {/* Service Cities – full width so many city tags don't crowd */}
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

        {/* ── 3-Tier Multi-Select Practice Category Section ── */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Practice Category &amp; Specializations (3-Tier Dropdowns)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Select Practice Area → Specialization → Specific Legal Services from the taxonomy
                </p>
              </div>
            </div>
            {selectedPracticeEntries.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                <Check className="h-3 w-3" />
                {selectedPracticeEntries.length} Selected
              </span>
            )}
          </div>

          {/* 3 Cascading Dropdowns — stacked full-width rather than a 3-col
              grid: md-outlined-select has a real minimum width (~210px) that
              a 3-up grid inside this card can't satisfy without overlap. */}
          <div className="grid grid-cols-1 gap-3">
            {/* Dropdown 1: Practice Area / Category */}
            <Select
              label="1. Practice Area *"
              value={selectedPracticeArea}
              onChange={handlePracticeAreaChange}
              options={LAWYER_PRACTICE_AREAS.map((pa) => ({ value: pa.name, label: pa.name }))}
              className="w-full"
            />

            {/* Dropdown 2: Specialization */}
            <Select
              label="2. Specialization *"
              value={selectedSpecialization}
              onChange={handleSpecializationChange}
              disabled={!selectedPracticeArea || availableSpecializations.length === 0}
              options={availableSpecializations.map((spec) => ({
                value: spec.name,
                label: spec.name,
              }))}
              supportingText={
                !selectedPracticeArea
                  ? "Select Practice Area first"
                  : availableSpecializations.length === 0
                    ? "No specializations available"
                    : undefined
              }
              className="w-full"
            />

            {/* Dropdown 3: Multi-Select Legal Services — hand-built (no M3
                primitive covers a checkbox multi-select), styled to match
                md-outlined-select's notched floating-label look so it doesn't
                stand out next to the two real Selects above it. */}
            <div className="relative">
              {/* Custom Multi-Select Dropdown Trigger */}
              <div
                onClick={() => {
                  if (selectedSpecialization) {
                    setIsMultiServiceDropdownOpen((prev) => !prev);
                  }
                }}
                className={`relative flex min-h-14 w-full items-center justify-between rounded-[4px] border px-3 text-xs transition-colors ${
                  !selectedSpecialization
                    ? "cursor-not-allowed opacity-60 text-muted-foreground border-border"
                    : "cursor-pointer text-foreground border-border focus-within:border-primary hover:border-primary/60"
                }`}
              >
                <span className="pointer-events-none absolute -top-2 left-2.5 bg-surface px-1 text-[11px] font-medium text-muted-foreground">
                  3. Legal Service(s)
                </span>
                <span className="truncate">
                  {!selectedSpecialization
                    ? "-- Select Specialization First --"
                    : selectedServicesMulti.length === 0
                      ? `Choose services (${availableLegalServices.length})`
                      : `${selectedServicesMulti.length} service(s) checked`}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                    isMultiServiceDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {selectedSpecialization && availableLegalServices.length > 0 && (
                <div className="mt-1 flex justify-end">
                  <Button
                    type="button"
                    variant="text"
                    onClick={selectAllServicesInSpec}
                    className="h-auto! min-h-0! px-0! text-[10px] hover:underline"
                  >
                    {selectedServicesMulti.length === availableLegalServices.length
                      ? "Deselect all"
                      : "Select all"}
                  </Button>
                </div>
              )}

              {/* Multi-Select Dropdown Popover */}
              {isMultiServiceDropdownOpen && selectedSpecialization && (
                <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-lg space-y-1">
                  {availableLegalServices.length === 0 ? (
                    <p className="p-2 text-center text-xs text-muted-foreground">
                      No specific services listed
                    </p>
                  ) : (
                    availableLegalServices.map((service) => {
                      const isChecked = selectedServicesMulti.includes(service);
                      return (
                        <label
                          key={service}
                          className="flex items-center gap-2 rounded-md p-1.5 text-xs text-foreground hover:bg-muted/70 cursor-pointer select-none"
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleServiceInMulti(service)}
                          />
                          <span className="flex-1 leading-snug">{service}</span>
                        </label>
                      );
                    })
                  )}
                  <div className="pt-2 border-t border-border flex justify-end">
                    <Button
                      type="button"
                      variant="filled"
                      onClick={() => setIsMultiServiceDropdownOpen(false)}
                      className="h-auto! min-h-0! px-2.5! py-1! text-[10px]"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="filled"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleAddPracticeEntries}
              className="shadow-xs"
            >
              Add to Practice Areas
            </Button>

            {selectedPracticeEntries.length > 0 && (
              <Button
                type="button"
                variant="text"
                icon={<Trash2 className="h-3 w-3" />}
                onClick={clearAllPracticeEntries}
                className="h-auto! min-h-0! px-0! text-[11px]"
                style={
                  {
                    "--md-text-button-label-text-color": "var(--md-sys-color-on-surface-variant)",
                    "--md-text-button-with-icon-icon-color":
                      "var(--md-sys-color-on-surface-variant)",
                  } as React.CSSProperties
                }
              >
                Clear All
              </Button>
            )}
          </div>

          {practiceError && <p className="text-xs font-medium text-destructive">{practiceError}</p>}

          {/* Selected Badges / Chips Display */}
          {selectedPracticeEntries.length > 0 ? (
            <div className="space-y-2 pt-2 border-t border-primary/15">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Selected Categories &amp; Services ({selectedPracticeEntries.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
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
            <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              No practice categories added yet. Select from the 3 dropdowns above and click{" "}
              <strong className="text-foreground">"Add to Practice Areas"</strong>.
            </div>
          )}
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label="Email"
            type="email"
            required
            value={email}
            onChange={setEmail}
            placeholder="swathi@law.com"
            className="w-full"
          />

          <TextField
            label="Phone"
            required
            value={phone}
            onChange={setPhone}
            placeholder="+91 98100 12345"
            className="w-full"
          />
        </div>

        {/* Bar ID & Years of Experience */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        {/* Office Address */}
        <TextField
          label="Address"
          type="textarea"
          rows={2}
          value={address}
          onChange={setAddress}
          placeholder="Chamber No. 402, High Court Complex, Nampally, Hyderabad"
          className="w-full"
        />

        {/* Bio / About */}
        <TextField
          label="Bio / About"
          type="textarea"
          rows={3}
          value={bio}
          onChange={setBio}
          placeholder="Tell clients about your practice, experience, and approach…"
          className="w-full"
        />

        {/* Languages Spoken */}
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

        {/* Courts Practiced In */}
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

        {/* Awards & Recognition */}
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
            <ul className="mt-2 space-y-1.5">
              {awards.map((a, i) => (
                <li
                  key={`${a.title}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-foreground">
                    {a.title} <span className="font-normal text-muted-foreground">({a.year})</span>
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

        {/* ID Proof */}
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
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Government-issued ID or Bar Council Card (Aadhaar, Bar ID, PAN) — JPG, PNG or PDF, up to
            5MB.
          </p>
          {idProofError && (
            <p className="mt-1 text-[11px] font-medium text-destructive">{idProofError}</p>
          )}
        </Field>

        {/* Submit */}
        <Button type="submit" variant="filled" className="w-full shadow-md">
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
        <div className="mt-2 flex flex-wrap gap-1.5">
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
      <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
      <div className="space-y-2">
        {/* Quick filter input for 500+ courts list */}
        <div className="flex gap-2 items-start">
          <TextField
            value={searchFilter}
            onChange={setSearchFilter}
            placeholder="Type to filter court list (e.g. Telangana, Bombay, Consumer, NCLT)..."
            className="flex-1"
          />
          {searchFilter && (
            <Button type="button" variant="outlined" onClick={() => setSearchFilter("")}>
              Clear
            </Button>
          )}
        </div>

        {/* Dropdown Select */}
        <Select
          value={selectedCourt}
          onChange={(val) => {
            setSelectedCourt(val);
            if (val) handleAddCourt(val);
          }}
          options={filteredCourts.map((c) => ({ value: c, label: c }))}
          supportingText={
            filteredCourts.length === 0
              ? "No matching courts found"
              : `Select Court to Add (${filteredCourts.length} courts)`
          }
          className="w-full"
        />
      </div>

      {values.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
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
