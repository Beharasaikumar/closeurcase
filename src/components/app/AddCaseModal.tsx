import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  TextField,
  Select,
  Button,
} from "@/components/m3";
import { getCitizens, addCase } from "@/data/appStore";
import { categories } from "@/data/mock";
import type { CaseStatus, LegalCase } from "@/types";

const STATUS_OPTIONS: CaseStatus[] = [
  "Pending",
  "Submitted",
  "Assigned",
  "Rejected",
  "Under Review",
  "In Progress",
  "Awaiting Documents",
  "Resolved",
  "Closed",
];

const nativeInputCls =
  "w-full rounded-[var(--md-sys-shape-corner-extra-small)] border border-[var(--md-sys-color-outline)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:border-2 focus:px-3.25 focus:py-2.25 focus:outline-none transition-colors";

export function AddCaseModal({
  open,
  onOpenChange,
  lawyerId,
  lawyerName,
  editingCase,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lawyerId: string;
  lawyerName: string;
  editingCase?: LegalCase;
  onSaved?: (c: LegalCase) => void;
}) {
  const navigate = useNavigate();
  const citizens = getCitizens();
  const isEdit = Boolean(editingCase);

  const [title, setTitle] = useState(editingCase?.title ?? "");
  const [clientName, setClientName] = useState(editingCase?.citizenName ?? "");
  const [category, setCategory] = useState(editingCase?.category ?? categories[0]);
  const [courtName, setCourtName] = useState(editingCase?.caseDetails.courtName ?? "");
  const [caseNumber, setCaseNumber] = useState(editingCase?.caseDetails.caseNumber ?? "");
  const [cnrNumber, setCnrNumber] = useState(editingCase?.caseDetails.cnr ?? "");
  const [filingDate, setFilingDate] = useState(editingCase?.caseDetails.filingDate ?? "");
  const [stage, setStage] = useState(editingCase?.caseDetails.purpose ?? "");
  const [status, setStatus] = useState<CaseStatus>(editingCase?.status ?? "Submitted");
  const [city, setCity] = useState(editingCase?.city ?? "");

  function reset() {
    setTitle("");
    setClientName("");
    setCategory(categories[0]);
    setCourtName("");
    setCaseNumber("");
    setCnrNumber("");
    setFilingDate("");
    setStage("");
    setStatus("Submitted");
    setCity("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const linkedCitizen = citizens.find(
      (c) => c.name.toLowerCase() === clientName.trim().toLowerCase(),
    );

    const legalCase: LegalCase = editingCase
      ? {
          ...editingCase,
          title: title.trim(),
          citizenName: clientName.trim(),
          citizenId: linkedCitizen?.id ?? editingCase.citizenId,
          category,
          caseDetails: {
            ...editingCase.caseDetails,
            courtName: courtName.trim() || editingCase.caseDetails.courtName,
            caseNumber: caseNumber.trim() || undefined,
            cnr: cnrNumber.trim() || undefined,
            filingDate: filingDate || undefined,
            purpose: stage.trim() || undefined,
          },
          status,
          city: city.trim() || editingCase.city,
          updatedAt: today,
        }
      : {
          id: `CS-${Math.floor(10000 + Math.random() * 90000)}`,
          title: title.trim(),
          description: "",
          category,
          citizenId: linkedCitizen?.id,
          citizenName: clientName.trim(),
          lawyerId,
          lawyerName,
          status,
          city: city.trim() || "Not specified",
          createdAt: today,
          updatedAt: today,
          timeline: [{ id: "t1", status, at: today, time, note: "Case added manually" }],
          source: "manual",
          caseDetails: {
            courtName: courtName.trim() || "Not yet determined",
            caseNumber: caseNumber.trim() || undefined,
            cnr: cnrNumber.trim() || undefined,
            filingDate: filingDate || undefined,
            purpose: stage.trim() || undefined,
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
          files: { files: [] },
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

    addCase(legalCase);
    reset();
    onOpenChange(false);
    onSaved?.(legalCase);
    if (!isEdit) {
      navigate({ to: "/lawyer/cases/$id", params: { id: legalCase.id } });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
          <PlusCircle className="h-5 w-5 text-primary" />
          {isEdit ? "Edit Case" : "Add Case Manually"}
        </DialogTitle>
      </DialogHeader>

      <DialogContent>
        <form id="add-case-form" onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Case Title / Parties"
            value={title}
            onChange={setTitle}
            placeholder="e.g. Ramesh Kumar vs State Bank of Hyderabad"
            required
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Kept as a native input (not the M3 TextField) specifically to preserve the
                datalist-based client-name autocomplete — md-outlined-text-field doesn't
                support the `list` attribute. */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
                Client Name<span className="ml-0.5 text-destructive">*</span>
              </span>
              <input
                className={nativeInputCls}
                list="client-suggestions"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Who filed this case"
                required
              />
              <datalist id="client-suggestions">
                {citizens.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </label>
            <Select
              label="Category"
              value={category}
              onChange={(v) => setCategory(v as typeof category)}
              options={categories.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <TextField
            label="Court Name"
            value={courtName}
            onChange={setCourtName}
            placeholder="e.g. City Civil Court, Banjara Hills, Hyderabad"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Case Number"
              value={caseNumber}
              onChange={setCaseNumber}
              placeholder="e.g. OS/4/2025"
            />
            <TextField
              label="CNR Number"
              value={cnrNumber}
              onChange={setCnrNumber}
              placeholder="Optional"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Native input: md-outlined-text-field doesn't support type="date" (no picker). */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
                Filing Date
              </span>
              <input
                type="date"
                className={nativeInputCls}
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
              />
            </label>
            <TextField
              label="Stage"
              value={stage}
              onChange={setStage}
              placeholder="e.g. Written Statement"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="City" value={city} onChange={setCity} />
            <Select
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as CaseStatus)}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button variant="outlined" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Save Changes" : "Add Case"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
