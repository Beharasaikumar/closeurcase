import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { categories } from "@/data/mock";
import { addLawyer } from "@/data/appStore";
import { readFileAsDataUrl } from "@/lib/files";
import type { LegalCategory, LawyerAward, LawyerPracticeArea } from "@/types";

const MAX_ID_PROOF_BYTES = 5 * 1024 * 1024;

export const Route = createFileRoute("/lawyer-register")({
  head: () => ({ meta: [{ title: "Lawyer registration — CloseurCase" }] }),
  component: LawyerRegister,
});

function LawyerRegister() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<LegalCategory>("Criminal");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [barId, setBarId] = useState("");
  const [address, setAddress] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [bio, setBio] = useState("");

  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");

  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specializationInput, setSpecializationInput] = useState("");

  const [courts, setCourts] = useState<string[]>([]);
  const [courtInput, setCourtInput] = useState("");

  const [practiceAreas, setPracticeAreas] = useState<LawyerPracticeArea[]>([]);
  const [paName, setPaName] = useState("");
  const [paProficiency, setPaProficiency] = useState(70);

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

  function addPracticeArea() {
    const trimmed = paName.trim();
    if (!trimmed) return;
    setPracticeAreas((prev) => [
      ...prev,
      { name: trimmed, proficiency: Math.min(100, Math.max(0, paProficiency)) },
    ]);
    setPaName("");
    setPaProficiency(70);
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
    const idProofUrl = idProofFile ? await readFileAsDataUrl(idProofFile) : undefined;
    addLawyer({
      name,
      category,
      city: city || "Hyderabad",
      area: area.trim() || undefined,
      email,
      phone,
      barId,
      experienceYears: Number(experienceYears) || 5,
      status: "Pending",
      officeAddress: address || undefined,
      bio: bio.trim() || undefined,
      languages: languages.length ? languages : undefined,
      specializations: specializations.length ? specializations : undefined,
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
      title="Lawyer Registration"
      subtitle="Register your credentials to get verified and matched with clients."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Full name">
          <input
            className={inputCls}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adv. Swathi Reddy"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Practice Category">
            <select
              className={selectCls}
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as LegalCategory)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Primary City">
            <input
              className={inputCls}
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Hyderabad"
            />
          </Field>
        </div>

        <Field label="Area / Locality">
          <input
            className={inputCls}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Nampally"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="swathi@law.com"
            />
          </Field>

          <Field label="Phone">
            <input
              className={inputCls}
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98100 12345"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bar Registration ID">
            <input
              className={inputCls}
              required
              value={barId}
              onChange={(e) => setBarId(e.target.value)}
              placeholder="TS/2014/1023"
            />
          </Field>

          <Field label="Years of Experience">
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

        <Field label="Office Address">
          <textarea
            className={inputCls}
            rows={2}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Chamber No. 402, High Court Complex, Nampally, Hyderabad"
          />
        </Field>

        <Field label="Bio / About">
          <textarea
            className={inputCls}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about your practice, experience, and approach…"
          />
        </Field>

        <TagListField
          label="Languages Spoken"
          placeholder="e.g. Telugu"
          values={languages}
          inputValue={languageInput}
          onInputChange={setLanguageInput}
          onAdd={() => addTag(languageInput, setLanguages, setLanguageInput)}
          onRemove={(i) => removeTag(i, setLanguages)}
        />

        <Field label="Practice Areas (with proficiency)">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className={`${inputCls} sm:flex-1`}
              value={paName}
              onChange={(e) => setPaName(e.target.value)}
              placeholder="e.g. Criminal Defense"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={100}
                className={`${inputCls} w-20`}
                value={paProficiency}
                onChange={(e) => setPaProficiency(Number(e.target.value))}
                aria-label="Proficiency percentage"
              />
              <button type="button" onClick={addPracticeArea} className={addBtnCls}>
                Add
              </button>
            </div>
          </div>
          {practiceAreas.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {practiceAreas.map((pa, i) => (
                <li
                  key={`${pa.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-foreground">{pa.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">{pa.proficiency}%</span>
                    <button
                      type="button"
                      onClick={() => setPracticeAreas((prev) => prev.filter((_, x) => x !== i))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${pa.name}`}
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Field>

        <TagListField
          label="Specializations"
          placeholder="e.g. Property Partition"
          values={specializations}
          inputValue={specializationInput}
          onInputChange={setSpecializationInput}
          onAdd={() => addTag(specializationInput, setSpecializations, setSpecializationInput)}
          onRemove={(i) => removeTag(i, setSpecializations)}
        />

        <TagListField
          label="Courts Practiced In"
          placeholder="e.g. Telangana High Court"
          values={courts}
          inputValue={courtInput}
          onInputChange={setCourtInput}
          onAdd={() => addTag(courtInput, setCourts, setCourtInput)}
          onRemove={(i) => removeTag(i, setCourts)}
        />

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

        <Field label="ID Proof">
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
                <span className="truncate">{idProofFile.name}</span>
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
            Government-issued ID (Aadhaar, PAN, Passport, etc.) — JPG, PNG or PDF, up to 5MB.
          </p>
          {idProofError && (
            <p className="mt-1 text-[11px] font-medium text-destructive">{idProofError}</p>
          )}
        </Field>

        <button className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all">
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

function TagListField({
  label,
  placeholder,
  values,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  values: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" onClick={onAdd} className={addBtnCls}>
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground"
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive"
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
