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
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Note:</strong> You can log in and explore the Lawyer Workspace while
            verification is underway.
          </div>
          <button
            onClick={() => navigate({ to: "/login" })}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-all"
          >
            Back to Sign in
          </button>
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
            <button
              type="button"
              id="toggle-lawyer"
              onClick={() => setRegistrationType("lawyer")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold transition-all duration-200 ${
                !isFirm
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Individual Lawyer
            </button>
            <button
              type="button"
              id="toggle-firm"
              onClick={() => setRegistrationType("firm")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold transition-all duration-200 ${
                isFirm
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Law Firm / Organisation
            </button>
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
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <button
              type="button"
              onClick={() => {
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
              className="flex items-center gap-1 text-[11px] text-destructive hover:underline"
            >
              <X className="h-3 w-3" /> Remove photo
            </button>
          )}
        </div>

        {/* Full Name / Organisation Name */}
        <Field label={isFirm ? "Organisation Name *" : "Full name *"}>
          <input
            className={inputCls}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isFirm ? "M/s. Reddy & Associates" : "Adv. Swathi Reddy"}
          />
        </Field>

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

          {/* 3 Cascading Dropdowns */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Dropdown 1: Practice Area / Category */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground flex items-center gap-1">
                <span>1. Practice Area *</span>
              </label>
              <select
                className={selectCls}
                value={selectedPracticeArea}
                onChange={(e) => handlePracticeAreaChange(e.target.value)}
              >
                <option value="">-- Select Practice Area --</option>
                {LAWYER_PRACTICE_AREAS.map((pa) => (
                  <option key={pa.name} value={pa.name}>
                    {pa.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown 2: Specialization */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground flex items-center gap-1">
                <span>2. Specialization *</span>
              </label>
              <select
                className={selectCls}
                value={selectedSpecialization}
                onChange={(e) => handleSpecializationChange(e.target.value)}
                disabled={!selectedPracticeArea || availableSpecializations.length === 0}
              >
                <option value="">
                  {!selectedPracticeArea
                    ? "-- Select Practice Area First --"
                    : availableSpecializations.length === 0
                      ? "No specializations available"
                      : "-- Select Specialization --"}
                </option>
                {availableSpecializations.map((spec) => (
                  <option key={spec.name} value={spec.name}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown 3: Multi-Select Legal Services */}
            <div className="relative">
              <label className="mb-1 block text-xs font-semibold text-foreground flex items-center justify-between">
                <span>3. Legal Service(s)</span>
                {selectedSpecialization && availableLegalServices.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllServicesInSpec}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    {selectedServicesMulti.length === availableLegalServices.length
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                )}
              </label>

              {/* Custom Multi-Select Dropdown Trigger */}
              <div
                onClick={() => {
                  if (selectedSpecialization) {
                    setIsMultiServiceDropdownOpen((prev) => !prev);
                  }
                }}
                className={`flex min-h-[34px] w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-1.5 text-xs transition-colors ${
                  !selectedSpecialization
                    ? "cursor-not-allowed opacity-60 text-muted-foreground"
                    : "cursor-pointer text-foreground focus-within:border-primary hover:border-primary/60"
                }`}
              >
                <span className="truncate">
                  {!selectedSpecialization
                    ? "-- Select Specialization First --"
                    : selectedServicesMulti.length === 0
                      ? `Choose services (${availableLegalServices.length})`
                      : `${selectedServicesMulti.length} service(s) checked`}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                    isMultiServiceDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

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
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleServiceInMulti(service)}
                            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/30"
                          />
                          <span className="flex-1 leading-snug">{service}</span>
                        </label>
                      );
                    })
                  )}
                  <div className="pt-2 border-t border-border flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsMultiServiceDropdownOpen(false)}
                      className="rounded bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddPracticeEntries}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add to Practice Areas
            </button>

            {selectedPracticeEntries.length > 0 && (
              <button
                type="button"
                onClick={clearAllPracticeEntries}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </button>
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
                  <span
                    key={entry.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-background px-2.5 py-1.5 text-xs text-foreground shadow-2xs group"
                  >
                    <span className="font-bold text-primary">{entry.practiceArea}</span>
                    <span className="text-muted-foreground">›</span>
                    <span className="font-semibold text-foreground/90">{entry.specialization}</span>
                    {entry.legalService && (
                      <>
                        <span className="text-muted-foreground">›</span>
                        <span className="text-xs text-muted-foreground">{entry.legalService}</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removePracticeEntry(entry.id)}
                      className="ml-1 text-muted-foreground hover:text-destructive group-hover:text-foreground"
                      aria-label="Remove item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
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
          <Field label="Email *">
            <input
              type="email"
              className={inputCls}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="swathi@law.com"
            />
          </Field>

          <Field label="Phone *">
            <input
              className={inputCls}
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98100 12345"
            />
          </Field>
        </div>

        {/* Bar ID & Years of Experience */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Bar Registration ID *">
            <input
              className={inputCls}
              required
              value={barId}
              onChange={(e) => setBarId(e.target.value)}
              placeholder="TS/2014/1023"
            />
          </Field>

          <Field label="Years of Experience *">
            <input
              type="number"
              min={1}
              max={50}
              className={inputCls}
              required
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
            />
          </Field>
        </div>

        {/* Office Address */}
        <Field label="Address">
          <textarea
            className={inputCls}
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Chamber No. 402, High Court Complex, Nampally, Hyderabad"
          />
        </Field>

        {/* Bio / About */}
        <Field label="Bio / About">
          <textarea
            className={inputCls}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about your practice, experience, and approach…"
          />
        </Field>

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
            <input
              className={`${inputCls} sm:flex-1`}
              value={awardTitle}
              onChange={(e) => setAwardTitle(e.target.value)}
              placeholder="e.g. Client's Choice Lawyer"
            />
            <div className="flex gap-2">
              <input
                className={`${inputCls} w-24`}
                value={awardYear}
                onChange={(e) => setAwardYear(e.target.value)}
                placeholder="2025"
                aria-label="Award year"
              />
              <button type="button" onClick={addAward} className={addBtnCls}>
                Add
              </button>
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
                  <button
                    type="button"
                    onClick={() => setAwards((prev) => prev.filter((_, x) => x !== i))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${a.title}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Field>

        {/* ID Proof */}
        <Field label="ID Proof Document">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => idProofInputRef.current?.click()}
              className={`${addBtnCls} inline-flex items-center gap-1.5`}
            >
              <Upload className="h-3.5 w-3.5" />
              Choose File
            </button>
            {idProofFile ? (
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-foreground">
                <span className="truncate font-medium">{idProofFile.name}</span>
                <button
                  type="button"
                  onClick={() => setIdProofFile(null)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Remove ID proof"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
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
        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
        >
          Submit for Verification
        </button>
      </form>
    </AuthLayout>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none";
const selectCls =
  "w-full min-w-0 truncate rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none";
const addBtnCls =
  "shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all";

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
    <Field label={label}>
      <div className="flex gap-2">
        <select
          className={selectCls}
          value={selectedVal}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {availableOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive p-0.5 leading-none transition-colors"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
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
    <Field label={label}>
      <div className="space-y-2">
        {/* Quick filter input for 500+ courts list */}
        <div className="flex gap-2">
          <input
            type="text"
            className={`${inputCls} text-xs`}
            placeholder="Type to filter court list (e.g. Telangana, Bombay, Consumer, NCLT)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter("")}
              className="rounded-lg border border-border bg-surface px-2.5 text-xs text-muted-foreground hover:bg-muted"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dropdown Select */}
        <select
          className={selectCls}
          value={selectedCourt}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedCourt(val);
            if (val) handleAddCourt(val);
          }}
        >
          <option value="">
            {filteredCourts.length === 0
              ? "No matching courts found"
              : `-- Select Court to Add (${filteredCourts.length} courts) --`}
          </option>
          {filteredCourts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {values.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              <Scale className="h-3 w-3 text-primary shrink-0" />
              <span>{v}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive ml-1 p-0.5 leading-none transition-colors"
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}
