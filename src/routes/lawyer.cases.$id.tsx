import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  getCases,
  updateCaseStatus,
  updateCaseFields,
  addHearing,
  updateHearing,
  deleteHearing,
  getCaseNotes,
  addCaseNote,
  subscribeToStore,
} from "@/data/appStore";
import type { CaseStatus, Hearing, LegalCase, TimelineEvent } from "@/types";
import { StatusDot } from "@/components/app/StatusDot";
import { AddCaseModal } from "@/components/app/AddCaseModal";
import { Tabs, TextField, Select, Button, IconButton } from "@/components/m3";
import {
  ChevronRight,
  Pencil,
  Printer,
  Landmark,
  MapPin,
  User,
  Plus,
  Trash2,
  Check,
  FileText,
  Eye,
  X,
  Download,
  FileCheck,
  StickyNote,
  Send,
  CalendarClock,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/lawyer/cases/$id")({
  component: CaseDetailPage,
});

// Native input styling (M3-token-based) for the couple of fields kept as raw
// <input> — currently just type="date", which md-outlined-text-field doesn't support.
const nativeInputCls =
  "w-full rounded-[var(--md-sys-shape-corner-extra-small)] border border-[var(--md-sys-color-outline)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:border-2 focus:px-3.25 focus:py-2.25 focus:outline-none transition-colors";

const STATUSES: CaseStatus[] = [
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

function formatDate(iso?: string) {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MetaLine({ parts }: { parts: (React.ReactNode | false | undefined)[] }) {
  const items = parts.filter(Boolean) as React.ReactNode[];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-2.5">
          {i > 0 && (
            <span className="text-muted-foreground/40" aria-hidden>
              •
            </span>
          )}
          {item}
        </span>
      ))}
    </div>
  );
}

function CaseDetailPage() {
  const { id } = Route.useParams();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    return subscribeToStore(sync);
  }, []);

  const c = allCases.find((x) => x.id === id);

  if (!c) {
    return (
      <div className="max-w-3xl space-y-4 text-center py-16">
        <p className="text-sm font-bold text-foreground">Case not found</p>
        <p className="text-xs text-muted-foreground">
          This case may have been removed, or the link is incorrect.
        </p>
        <Link
          to="/lawyer/cases"
          className="inline-block text-xs font-bold text-primary hover:underline"
        >
          Back to My Cases
        </Link>
      </div>
    );
  }

  return <CaseDetailBody caseItem={c} />;
}

function CaseDetailBody({ caseItem: c }: { caseItem: LegalCase }) {
  const navigate = useNavigate();
  const readOnly = c.source === "ecourt";
  const [editOpen, setEditOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CaseStatus>(c.status);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLawyers, setShowLawyers] = useState(false);
  const [fileNoDraft, setFileNoDraft] = useState("");
  const [editingFileNo, setEditingFileNo] = useState(false);
  const [tab, setTab] = useState<"history" | "documents" | "notes">("history");

  useEffect(() => {
    setPendingStatus(c.status);
    setSaveSuccess(false);
  }, [c.id, c.status]);

  const handleSaveStatus = () => {
    updateCaseStatus(c.id, pendingStatus, `Lawyer updated status to ${pendingStatus}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveFileNo = () => {
    updateCaseFields(c.id, { fileNo: fileNoDraft.trim() || undefined });
    setEditingFileNo(false);
  };

  const nextHearing = [...c.hearings]
    .filter((h) => h.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className="space-y-5">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2.5">
        <IconButton
          variant="outlined"
          ariaLabel="Back to My Cases"
          onClick={() => navigate({ to: "/lawyer/cases" })}
        >
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            to="/lawyer/cases"
            className="shrink-0 font-semibold hover:text-foreground hover:underline"
          >
            My Cases
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[240px] sm:max-w-md">{c.title}</span>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {!readOnly && editingFileNo ? (
            <div className="flex items-center gap-2">
              <TextField
                label="File No."
                value={fileNoDraft}
                onChange={setFileNoDraft}
                autoFocus
                className="w-40"
              />
              <Button onClick={handleSaveFileNo}>Save</Button>
            </div>
          ) : c.fileNo || !readOnly ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-muted-foreground">File No.</span>
              {c.fileNo ? (
                <span className="font-semibold text-foreground">{c.fileNo}</span>
              ) : (
                <button
                  onClick={() => {
                    setFileNoDraft("");
                    setEditingFileNo(true);
                  }}
                  className="cursor-pointer font-bold text-primary hover:underline"
                >
                  + Add
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && (
              <Button
                variant="outlined"
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
            )}
            <Button
              variant="outlined"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <h1 className="text-lg sm:text-xl font-bold text-foreground leading-snug max-w-2xl">
            {c.title}
          </h1>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5">
            <StatusDot status={c.status} />
          </div>
        </div>

        {/* Case facts */}
        <div className="space-y-2.5 border-b border-border pb-4">
          <MetaLine
            parts={[
              c.caseNumber && (
                <span className="font-mono font-bold text-foreground">{c.caseNumber}</span>
              ),
              c.courtName && (
                <span className="inline-flex items-center gap-1.5 text-foreground/90">
                  <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {c.courtName}
                </span>
              ),
              c.lawyerName && (
                <span className="text-foreground/90">
                  Lawyer: <span className="font-semibold text-foreground">{c.lawyerName}</span>
                </span>
              ),
            ]}
          />

          <MetaLine
            parts={[
              c.cnrNumber && (
                <span className="text-foreground/90">
                  CNR Number:{" "}
                  <span className="font-mono font-bold text-foreground">{c.cnrNumber}</span>
                </span>
              ),
              c.stage && (
                <span className="text-foreground/90">
                  Stage: <span className="font-bold text-foreground">{c.stage}</span>
                </span>
              ),
              c.filingDate && (
                <span className="text-foreground/90">
                  Filing Date:{" "}
                  <span className="font-semibold text-foreground">{formatDate(c.filingDate)}</span>
                </span>
              ),
            ]}
          />

          {(c.petitionerLawyers?.length || c.respondentLawyers?.length) && (
            <div>
              <button
                onClick={() => setShowLawyers((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                Petitioner & Respondent Lawyers
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${showLawyers ? "rotate-90" : ""}`}
                />
              </button>
              {showLawyers && (
                <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-background p-3 text-sm">
                  {c.petitioners && (
                    <p>
                      <span className="font-bold text-foreground">Petitioner:</span>{" "}
                      <span className="text-foreground/80">
                        {c.petitioners.join(", ")}
                        {c.petitionerLawyers?.length
                          ? ` — Adv. ${c.petitionerLawyers.join(", ")}`
                          : ""}
                      </span>
                    </p>
                  )}
                  {c.respondents && (
                    <p>
                      <span className="font-bold text-foreground">Respondent:</span>{" "}
                      <span className="text-foreground/80">
                        {c.respondents.join(", ")}
                        {c.respondentLawyers?.length
                          ? ` — Adv. ${c.respondentLawyers.join(", ")}`
                          : ""}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next hearing + client */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
          {nextHearing && (
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--md-extended-color-warning) 10%, transparent)",
                color: "var(--md-extended-color-warning)",
              }}
            >
              <CalendarClock className="h-4 w-4 shrink-0" />
              Next Hearing: <span className="font-bold">{formatDate(nextHearing.date)}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 text-sm text-foreground/90">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            Client: <span className="font-bold text-foreground">{c.citizenName}</span>
          </div>
        </div>

        {/* Status quick update */}
        {!readOnly && (
          <div className="flex flex-wrap items-end gap-2 pt-1">
            <Select
              label="Update Status"
              value={pendingStatus}
              onChange={(v) => setPendingStatus(v as CaseStatus)}
              options={STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <Button
              icon={saveSuccess ? <FileCheck className="h-4 w-4" /> : undefined}
              onClick={handleSaveStatus}
              disabled={pendingStatus === c.status && !saveSuccess}
            >
              {saveSuccess ? "Saved" : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
        tabs={[
          { value: "history", label: "Case History" },
          { value: "documents", label: "Documents" },
          { value: "notes", label: "Notes" },
        ]}
      />

      <div className="mt-4">
        {tab === "history" && <CaseHistoryTab caseItem={c} readOnly={readOnly} />}
        {tab === "documents" && <DocumentsTab caseItem={c} />}
        {tab === "notes" && <NotesTab caseId={c.id} readOnly={readOnly} />}
      </div>

      {!readOnly && (
        <AddCaseModal
          open={editOpen}
          onOpenChange={setEditOpen}
          lawyerId={c.lawyerId ?? "l_001"}
          lawyerName={c.lawyerName ?? "Swathi Reddy"}
          editingCase={c}
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Case History tab ───────────────────────────── */

type MergedEvent =
  | { kind: "hearing"; date: string; hearing: Hearing }
  | { kind: "status"; date: string; event: TimelineEvent };

function monthLabel(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function CaseHistoryTab({ caseItem: c, readOnly }: { caseItem: LegalCase; readOnly: boolean }) {
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [newHearing, setNewHearing] = useState({ date: "", time: "", courtOrVenue: "", note: "" });
  const [editingHearingId, setEditingHearingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ date: "", time: "", courtOrVenue: "", note: "" });

  const handleAddHearing = () => {
    if (!newHearing.date) return;
    addHearing(c.id, {
      date: newHearing.date,
      time: newHearing.time || undefined,
      courtOrVenue: newHearing.courtOrVenue || undefined,
      note: newHearing.note || undefined,
    });
    setNewHearing({ date: "", time: "", courtOrVenue: "", note: "" });
    setShowAddHearing(false);
  };

  const startEditHearing = (h: Hearing) => {
    setEditingHearingId(h.id);
    setEditDraft({
      date: h.date,
      time: h.time ?? "",
      courtOrVenue: h.courtOrVenue ?? "",
      note: h.note ?? "",
    });
  };

  const handleSaveHearingEdit = () => {
    if (!editingHearingId || !editDraft.date) return;
    updateHearing(c.id, editingHearingId, {
      date: editDraft.date,
      time: editDraft.time || undefined,
      courtOrVenue: editDraft.courtOrVenue || undefined,
      note: editDraft.note || undefined,
    });
    setEditingHearingId(null);
  };

  const groups = useMemo(() => {
    const merged: MergedEvent[] = [
      ...c.hearings.map((h): MergedEvent => ({ kind: "hearing", date: h.date, hearing: h })),
      ...c.timeline.map((t): MergedEvent => ({ kind: "status", date: t.at, event: t })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const byMonth = new Map<string, MergedEvent[]>();
    for (const item of merged) {
      const label = monthLabel(item.date);
      if (!byMonth.has(label)) byMonth.set(label, []);
      byMonth.get(label)!.push(item);
    }
    return Array.from(byMonth.entries());
  }, [c.hearings, c.timeline]);

  return (
    <div className="space-y-5">
      {!readOnly && (
        <div className="flex justify-end">
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddHearing((v) => !v)}>
            Add Hearing
          </Button>
        </div>
      )}

      {!readOnly && showAddHearing && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Native input: md-outlined-text-field doesn't support type="date" (no picker). */}
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
                Date <span className="text-destructive">*</span>
              </span>
              <input
                type="date"
                value={newHearing.date}
                onChange={(e) => setNewHearing((p) => ({ ...p, date: e.target.value }))}
                className={nativeInputCls}
              />
            </label>
            <TextField
              label="Time"
              placeholder="e.g. 11:00 AM"
              value={newHearing.time}
              onChange={(v) => setNewHearing((p) => ({ ...p, time: v }))}
            />
            <TextField
              label="Court / Venue"
              value={newHearing.courtOrVenue}
              onChange={(v) => setNewHearing((p) => ({ ...p, courtOrVenue: v }))}
            />
            <TextField
              label="Note"
              value={newHearing.note}
              onChange={(v) => setNewHearing((p) => ({ ...p, note: v }))}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outlined" onClick={() => setShowAddHearing(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHearing} disabled={!newHearing.date}>
              Save Hearing
            </Button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="rounded-lg border border-border/60 bg-background p-4 text-center text-xs text-muted-foreground">
          No case history yet.
        </p>
      ) : (
        groups.map(([label, items]) => (
          <div key={label} className="space-y-3">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
              {label}
            </span>
            <div className="space-y-3">
              {items.map((item) => {
                const d = new Date(item.date);
                const day = d.getDate();
                const weekday = d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase();
                return (
                  <div
                    key={item.kind + (item.kind === "hearing" ? item.hearing.id : item.event.id)}
                    className="flex flex-col gap-2 sm:flex-row sm:gap-4"
                  >
                    <div className="flex shrink-0 items-center gap-2 sm:w-12 sm:flex-col sm:items-center sm:pt-1">
                      <span className="text-sm font-bold text-foreground">{day}</span>
                      <span className="text-[10px] text-muted-foreground">{weekday}</span>
                    </div>
                    <div className="relative flex-1 sm:border-l sm:border-border sm:pl-4">
                      <span className="absolute -left-[5px] top-2 hidden h-2.5 w-2.5 rounded-full bg-primary sm:block" />
                      {item.kind === "hearing" ? (
                        <HearingCard
                          hearing={item.hearing}
                          readOnly={readOnly}
                          isEditing={!readOnly && editingHearingId === item.hearing.id}
                          editDraft={editDraft}
                          onEditDraftChange={setEditDraft}
                          onStartEdit={() => startEditHearing(item.hearing)}
                          onCancelEdit={() => setEditingHearingId(null)}
                          onSaveEdit={handleSaveHearingEdit}
                          onDelete={() => deleteHearing(c.id, item.hearing.id)}
                        />
                      ) : (
                        <div className="rounded-xl border border-border bg-background p-3 space-y-1">
                          <StatusDot status={item.event.status} />
                          {item.event.note && (
                            <p className="text-[11px] text-muted-foreground">{item.event.note}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface HearingDraft {
  date: string;
  time: string;
  courtOrVenue: string;
  note: string;
}

function HearingCard({
  hearing,
  readOnly,
  isEditing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: {
  hearing: Hearing;
  readOnly: boolean;
  isEditing: boolean;
  editDraft: HearingDraft;
  onEditDraftChange: (updater: (prev: HearingDraft) => HearingDraft) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  if (isEditing) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5">
        <div className="grid gap-2 sm:grid-cols-2">
          {/* Native input: md-outlined-text-field doesn't support type="date" (no picker). */}
          <input
            type="date"
            value={editDraft.date}
            onChange={(e) => onEditDraftChange((p) => ({ ...p, date: e.target.value }))}
            className={nativeInputCls}
          />
          <TextField
            placeholder="Time"
            value={editDraft.time}
            onChange={(v) => onEditDraftChange((p) => ({ ...p, time: v }))}
          />
          <TextField
            placeholder="Court / Venue"
            value={editDraft.courtOrVenue}
            onChange={(v) => onEditDraftChange((p) => ({ ...p, courtOrVenue: v }))}
          />
          <TextField
            placeholder="Note"
            value={editDraft.note}
            onChange={(v) => onEditDraftChange((p) => ({ ...p, note: v }))}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outlined" onClick={onCancelEdit}>
            Cancel
          </Button>
          <Button
            icon={<Check className="h-4 w-4" />}
            onClick={onSaveEdit}
            disabled={!editDraft.date}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-foreground">
          Hearing{hearing.time ? ` · ${hearing.time}` : ""}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {hearing.hearingType && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {hearing.hearingType}
            </span>
          )}
          {!readOnly && (
            <>
              <IconButton ariaLabel="Edit hearing" onClick={onStartEdit}>
                <Pencil className="h-4 w-4" />
              </IconButton>
              <IconButton ariaLabel="Delete hearing" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          )}
        </div>
      </div>
      {(hearing.courtRoom || hearing.itemNo) && (
        <p className="text-[11px] text-muted-foreground">
          {hearing.courtRoom && <>Court Room: {hearing.courtRoom}</>}
          {hearing.itemNo && <> · Item No: {hearing.itemNo}</>}
        </p>
      )}
      {hearing.judges && hearing.judges.length > 0 && (
        <p className="text-[11px] text-muted-foreground">Judge(s): {hearing.judges.join(", ")}</p>
      )}
      {!hearing.courtRoom && hearing.courtOrVenue && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {hearing.courtOrVenue}
        </p>
      )}
      {hearing.businessDetails && (
        <p className="text-[11px] text-foreground">{hearing.businessDetails}</p>
      )}
      {hearing.note && <p className="text-[11px] text-foreground">{hearing.note}</p>}
    </div>
  );
}

/* ───────────────────────────── Documents tab ───────────────────────────── */

function DocumentsTab({ caseItem: c }: { caseItem: LegalCase }) {
  const [activePdf, setActivePdf] = useState<{ name: string; size: string } | null>(null);
  const hasDocuments = Boolean(c.documents && c.documents.length > 0);

  return (
    <div className="space-y-3">
      {hasDocuments ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {c.documents.map((doc) => (
            <div
              key={doc.name}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.size || "PDF Document"}</p>
                </div>
              </div>
              <Button
                icon={<Eye className="h-4 w-4" />}
                onClick={() => setActivePdf({ name: doc.name, size: doc.size || "PDF Document" })}
                className="w-full sm:w-auto"
              >
                View PDF
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center space-y-1">
          <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1.5">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            No documents uploaded
          </p>
          <p className="text-xs text-muted-foreground">
            Documents shared for this case will appear here.
          </p>
        </div>
      )}

      {activePdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-4 bg-surface">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-foreground">{activePdf.name}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {activePdf.size} · PDF Document Preview
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outlined"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => alert(`Downloading ${activePdf.name}...`)}
                  className="hidden sm:inline-flex"
                >
                  Download
                </Button>
                <IconButton
                  ariaLabel="Download"
                  onClick={() => alert(`Downloading ${activePdf.name}...`)}
                  className="sm:hidden"
                >
                  <Download className="h-5 w-5" />
                </IconButton>
                <IconButton ariaLabel="Close preview" onClick={() => setActivePdf(null)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-muted/30 space-y-4">
              <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-8 shadow-sm space-y-6 text-foreground min-h-[500px]">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    IN THE HIGH COURT / DISTRICT COURT
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">PAGE 1 OF 3</span>
                </div>
                <div className="text-center space-y-1 py-2">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                    PETITION / WRIT PLEADINGS
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    CASE REGISTRATION NO: {c.caseNumber ?? c.id}
                  </p>
                </div>
                <div className="space-y-4 text-xs leading-relaxed text-foreground/90">
                  <p className="font-semibold text-foreground">
                    MEMORANDUM OF PETITION UNDER STATUTORY PROVISIONS:
                  </p>
                  <p className="bg-muted/40 p-3 rounded-lg border border-border/50">
                    {c.description}
                  </p>
                  <p>
                    1. The petitioner hereby submits that the facts mentioned above represent true
                    and certified records of the dispute in the matter of <strong>{c.title}</strong>{" "}
                    situated in <strong>{c.city}</strong>.
                  </p>
                  <p>
                    2. All supporting title deeds, notices, municipal site inspection reports, and
                    digital correspondence are annexed hereto as verified exhibits.
                  </p>
                  <p>
                    3. It is prayed that this Hon'ble Tribunal grant appropriate relief,
                    injunctions, or counter statements as deemed fit in the interest of justice.
                  </p>
                </div>
                <div className="pt-8 border-t border-border flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 text-[11px] text-muted-foreground">
                  <div>
                    <p className="font-bold text-foreground">DEPONENT / PETITIONER:</p>
                    <p>{c.citizenName}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p>VERIFIED & CERTIFIED</p>
                    <p>DATE: {new Date().toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border px-4 sm:px-6 py-3 bg-surface sm:flex-row sm:items-center sm:justify-between">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Viewing PDF Document in CloseUrCase Viewer
              </span>
              <Button onClick={() => setActivePdf(null)} className="w-full sm:w-auto">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Notes tab ───────────────────────────── */

function NotesTab({ caseId, readOnly }: { caseId: string; readOnly: boolean }) {
  const [notes, setNotes] = useState(() => getCaseNotes(caseId));
  const [text, setText] = useState("");

  useEffect(() => {
    const sync = () => setNotes(getCaseNotes(caseId));
    return subscribeToStore(sync);
  }, [caseId]);

  const handleAdd = () => {
    if (!text.trim()) return;
    addCaseNote(caseId, text.trim());
    setText("");
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <TextField
            type="textarea"
            rows={3}
            value={text}
            onChange={setText}
            placeholder="Add a note for this case…"
          />
          <div className="flex justify-end">
            <Button icon={<Send className="h-4 w-4" />} onClick={handleAdd} disabled={!text.trim()}>
              Add Note
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="rounded-lg border border-border/60 bg-background p-4 text-center text-xs text-muted-foreground">
          No notes yet.
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-surface p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <StickyNote className="h-3 w-3" />
                <span className="font-semibold">{n.author}</span>
                <span>·</span>
                <span>{new Date(n.createdAt).toLocaleString("en-IN")}</span>
              </div>
              <p className="text-xs text-foreground whitespace-pre-wrap">{n.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
