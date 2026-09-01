import { useRef, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Pencil,
  Eye,
  X,
  Check,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  ChevronRight,
} from "lucide-react";
import { Button, IconButton } from "@/components/m3";
import {
  getCases,
  saveCases,
  addCaseAttachments,
  updateCaseStatus,
  subscribeToStore,
} from "@/data/appStore";
import { MAX_ATTACHMENT_BYTES, formatFileSize, readFileAsDataUrl } from "@/lib/files";
import { searchCourtCases } from "@/data/courtCasesFixture";
import { CardPagination } from "@/components/app/CardPagination";
import { DocumentPreviewBody } from "@/components/app/DocumentPreview";
import type { LegalCase, CaseStatus, CaseDocument } from "@/types";
import { ChatButton } from "@/components/app/CaseChat";
import {
  STATUS_LIST,
  STATUS_META,
  STORED_STATUS_TO_FILTER,
  COURTS_FLAT,
  PRE_CNR_STAGES,
  StatusBadge,
  fmtDate,
  todayISO,
  getCourtHistory,
  getNextEntry,
  getStageHistory,
  type CourtHistoryRow,
} from "@/components/app/caseDocketShared";

type CnrImportResult =
  | { status: "found"; source: "database" | "ecourts"; title: string }
  | { status: "not-found" }
  | null;

function docLooksLikeImage(doc: CaseDocument): boolean {
  if (doc.fileMimeType) return doc.fileMimeType.startsWith("image/");
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.name);
}

function docDisplayTitle(doc: CaseDocument): string {
  const withoutExt = doc.name.replace(/\.[^./\\]+$/, "");
  const spaced = withoutExt.replace(/[_-]+/g, " ").trim();
  return spaced || doc.name;
}

/** A case is "Existing" if it was linked via a real court CNR number (either
 * through the wizard's Existing Case path, or imported from eCourts) —
 * everything else was freshly filed through CloseUrCase itself. */
export function caseTypeOf(c: LegalCase): "New" | "Existing" {
  return c.caseDetails.cnr ? "Existing" : "New";
}

function CaseTypeBadge({ caseItem }: { caseItem: LegalCase }) {
  const type = caseTypeOf(caseItem);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        type === "Existing"
          ? "bg-primary/10 text-primary"
          : "bg-[var(--md-extended-color-success)]/10 text-[var(--md-extended-color-success)]"
      }`}
    >
      {type}
    </span>
  );
}

/**
 * The cases table shared by citizen "My Cases", lawyer "Assigned Cases", and
 * both dashboards' "Upcoming Hearings" widget — one component, one set of
 * columns/behavior everywhere. `cases` controls which rows are shown (the
 * caller owns search/filter/sort), but save/delete always read and write the
 * full store list so editing a filtered-down view never drops other cases.
 */
export function CasesTable({ cases, role }: { cases: LegalCase[]; role: "lawyer" | "citizen" }) {
  const navigate = useNavigate();
  const [allCases, setAllCases] = useState<LegalCase[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);

  const [attachmentsCaseId, setAttachmentsCaseId] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const addAttachmentInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);
  const [previewFullScreen, setPreviewFullScreen] = useState(false);

  const [partyNames, setPartyNames] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [cnr, setCnr] = useState("");
  const [caseStatus, setCaseStatus] = useState("Submitted");
  const [journey, setJourney] = useState<CourtHistoryRow[]>([]);
  const [cnrImportResult, setCnrImportResult] = useState<CnrImportResult>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const isLawyer = role === "lawyer";

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    sync();
    return subscribeToStore(sync);
  }, []);

  // Reset to page 1 whenever the caller's filtered/sorted case list changes shape.
  useEffect(() => {
    setPage(1);
  }, [cases.length]);

  function handleOpenModal(c: LegalCase) {
    setEditingCase(c);
    setPartyNames(c.title || "");
    setCaseNo(c.caseDetails.caseNumber || "");
    setCnr(c.caseDetails.cnr || "");
    setCaseStatus(c.status || "Submitted");
    setJourney(getCourtHistory(c));
    setCnrImportResult(null);

    setDialogOpen(true);
  }

  function handleCnrChange(value: string) {
    setCnr(value);
    setCnrImportResult(null);
  }

  // Checks our own database first (a case already on file), then falls back to eCourts —
  // and on an eCourts hit, saves it into our database immediately so the next lookup for
  // this CNR is served from our own records instead of hitting eCourts again.
  function handleImportCnr() {
    const query = cnr.trim();
    if (!query) return;

    const dbMatch = allCases.find((c) => {
      if (c.id === editingCase?.id) return false;
      return (c.caseDetails.cnr || "").toLowerCase() === query.toLowerCase();
    });
    if (dbMatch) {
      setPartyNames(dbMatch.title);
      setCaseNo(dbMatch.caseDetails.caseNumber || "");
      setJourney(getCourtHistory(dbMatch));
      setCnrImportResult({ status: "found", source: "database", title: dbMatch.title });
      return;
    }

    const ecourtMatch =
      searchCourtCases({ method: "CNR Number", query }).find(
        (m) => m.cnrNumber.toLowerCase() === query.toLowerCase(),
      ) ?? null;

    if (!ecourtMatch) {
      setCnrImportResult({ status: "not-found" });
      return;
    }

    const hearings = ecourtMatch.historyOfCaseHearings || [];
    setPartyNames(ecourtMatch.title);
    setCaseNo(ecourtMatch.caseNumber);
    setJourney(hearings.map((h, i) => ({ ...h, id: `h_${i}` })));

    if (editingCase) {
      const today = todayISO();
      const updatedCases = allCases.map((c) =>
        c.id === editingCase.id
          ? {
              ...c,
              title: ecourtMatch.title,
              source: "ecourt" as const,
              caseDetails: {
                ...c.caseDetails,
                caseNumber: ecourtMatch.caseNumber,
                cnr: query,
                historyOfCaseHearings: hearings,
                hearingCount: hearings.length,
              },
              updatedAt: today,
            }
          : c,
      );
      saveCases(updatedCases);
    }

    setCnrImportResult({ status: "found", source: "ecourts", title: ecourtMatch.title });
  }

  function handleApprove(c: LegalCase) {
    updateCaseStatus(c.id, "Assigned", "Lawyer approved and accepted the case");
  }

  function handleReject(c: LegalCase) {
    if (confirm(`Reject case ${c.id} (${c.title})? The citizen will be notified.`)) {
      updateCaseStatus(c.id, "Rejected", "Lawyer declined to take up the case");
    }
  }

  function handleSaveCase() {
    if (!partyNames.trim() && !caseNo.trim()) {
      alert("Please enter at least party names or a case number.");
      return;
    }

    const today = todayISO();
    const historyOfCaseHearings = journey.map(({ id: _id, ...h }) => h);

    if (editingCase) {
      const statusChanged = editingCase.status !== caseStatus;
      const updatedCases = allCases.map((c) => {
        if (c.id !== editingCase.id) return c;
        const timeline = statusChanged
          ? [
              ...(c.timeline || []),
              {
                id: `t_${Date.now()}`,
                status: caseStatus as CaseStatus,
                at: today,
                time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                note: `Status updated to ${STATUS_META[caseStatus]?.label ?? caseStatus}`,
              },
            ]
          : c.timeline;
        return {
          ...c,
          title: partyNames.trim(),
          caseDetails: {
            ...c.caseDetails,
            caseNumber: caseNo.trim(),
            cnr: cnr.trim(),
            historyOfCaseHearings,
            hearingCount: historyOfCaseHearings.length,
          },
          status: caseStatus as CaseStatus,
          timeline,
          updatedAt: today,
        };
      });
      saveCases(updatedCases);
    }

    setDialogOpen(false);
  }

  function handleDeleteCase() {
    if (!editingCase) return;
    if (confirm("Delete this case permanently? This cannot be undone.")) {
      const updated = allCases.filter((x) => x.id !== editingCase.id);
      saveCases(updated);
      setDialogOpen(false);
    }
  }

  function closeAttachmentsModal() {
    setAttachmentsCaseId(null);
    setPreviewDoc(null);
    setPreviewFullScreen(false);
  }

  async function handleAddAttachments(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0 || !attachmentsCaseId) return;

    const oversized = files.find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (oversized) {
      setAttachmentError(`"${oversized.name}" is too large — please pick files under 4MB.`);
      return;
    }

    setAttachmentError("");
    setIsUploadingAttachment(true);
    try {
      const uploadDate = todayISO();
      const docs: CaseDocument[] = await Promise.all(
        files.map(async (f, i) => ({
          id: `d_${Date.now()}_${i}`,
          name: f.name,
          size: formatFileSize(f.size),
          uploadedAt: uploadDate,
          fileDataUrl: await readFileAsDataUrl(f),
          fileMimeType: f.type || undefined,
          uploadedBy: "citizen" as const,
        })),
      );
      addCaseAttachments(attachmentsCaseId, docs);
    } catch (err) {
      console.error("Failed to add attachment:", err);
      setAttachmentError("Failed to add attachment. Please try again.");
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  const today = todayISO();
  const sortedModalJourney = [...journey].sort((a, b) =>
    (a.hearingDate ?? a.businessOnDate ?? "9999").localeCompare(
      b.hearingDate ?? b.businessOnDate ?? "9999",
    ),
  );
  // Part 2 of the case journey (Lawyer to Court) shaped like eCourts' own
  // "Case History" table — Judge / Business on Date / Hearing Date / Purpose
  // of Listing — per case_structure.json's historyOfCaseHearings. Each entry
  // already carries its own `businessOnDate`, stored or set on CNR import.
  const courtHistoryRows = sortedModalJourney;
  const attachmentsCase = attachmentsCaseId
    ? allCases.find((c) => c.id === attachmentsCaseId)
    : null;

  const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageCases = cases.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <>
      {/* Case Cards */}
      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-xs text-muted-foreground">
          <h3 className="text-sm font-semibold text-foreground">No matching cases</h3>
          <p className="mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {pageCases.map((c) => {
            const entry = getNextEntry(c);
            const isPendingDecision = isLawyer && c.status === "Submitted";
            return (
              <div
                key={c.id}
                className={`flex h-full min-h-58 flex-col rounded-xl border p-3.5 shadow-2xs transition-all hover:shadow-sm sm:p-4 ${
                  isPendingDecision ? "" : "border-border bg-surface hover:border-primary/40"
                }`}
                style={
                  isPendingDecision
                    ? {
                        borderColor:
                          "color-mix(in srgb, var(--md-extended-color-warning) 35%, transparent)",
                        backgroundColor:
                          "color-mix(in srgb, var(--md-extended-color-warning) 7%, transparent)",
                      }
                    : undefined
                }
              >
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold text-foreground leading-snug sm:text-[15px]">
                        {c.title || "Untitled Matter"}
                      </h3>
                      <CaseTypeBadge caseItem={c} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      <span className="font-mono font-semibold text-primary">{c.id}</span>
                      <span aria-hidden>•</span>
                      <span className="font-mono font-semibold text-foreground/80">
                        CASE NO - {c.caseDetails.caseNumber || "N/A"}
                      </span>
                      {c.caseDetails.courtName && (
                        <>
                          <span aria-hidden>•</span>
                          <span>{c.caseDetails.courtName}</span>
                        </>
                      )}
                    </div>
                    <div
                      className={`font-mono text-[11px] ${
                        c.caseDetails.cnr ? "text-muted-foreground" : "text-muted-foreground/50"
                      }`}
                    >
                      CNR No - {c.caseDetails.cnr || "N/A"}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                    <StatusBadge status={c.status} />
                    {entry && (
                      <div className="text-right">
                        <div className="text-[11px] font-medium text-foreground">
                          {fmtDate(entry.hearingDate ?? entry.businessOnDate)}
                        </div>
                        {entry.purposeOfListing && (
                          <div className="text-[10px] text-muted-foreground">
                            {entry.purposeOfListing}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-border/60 pt-2">
                  {isLawyer && c.status === "Submitted" ? (
                    <>
                      <IconButton
                        variant="tonal"
                        title="Approve case"
                        onClick={() => handleApprove(c)}
                      >
                        <Check className="h-4 w-4 text-[var(--md-extended-color-success)]" />
                      </IconButton>
                      <IconButton variant="tonal" title="Reject case" onClick={() => handleReject(c)}>
                        <X className="h-4 w-4 text-[var(--md-sys-color-error)]" />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton
                      variant="tonal"
                      title={isLawyer ? "Edit case" : "View case details"}
                      onClick={() => handleOpenModal(c)}
                    >
                      {isLawyer ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </IconButton>
                  )}
                  <IconButton
                    variant="tonal"
                    title={`Attachments${c.files.files.length > 0 ? ` (${c.files.files.length})` : ""}`}
                    onClick={() => setAttachmentsCaseId(c.id)}
                  >
                    <Paperclip className="h-4 w-4" />
                  </IconButton>
                  {(isLawyer || c.lawyerName) && <ChatButton caseItem={c} role={role} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cases.length > 0 && (
        <div className="mt-4">
          <CardPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Courts Datalist */}
      <datalist id="courtsList">
        {COURTS_FLAT.map((c, i) => (
          <option key={i} value={c.name} label={`${c.type} · ${c.location}`} />
        ))}
      </datalist>

      {/* Custom Scrim + Modal Dialog (Bypasses shadow-DOM width capping, exact HTML match) */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6 overflow-y-auto backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialogOpen(false);
          }}
        >
          <div className="my-6 w-full max-w-[720px] rounded-[28px] bg-[var(--md-sys-color-surface-container-low,#f5f3f7)] shadow-2xl border border-border/80 overflow-hidden text-foreground">
            {/* Dialog Head */}
            <div className="flex items-start justify-between gap-4 p-6 pb-2">
              <div>
                <h2 className="text-2xl font-normal text-foreground leading-snug">
                  {partyNames || "Untitled Matter"}
                </h2>
                <div className="font-mono text-xs text-primary mt-1 font-medium">
                  {cnr ? `CNR ${cnr}` : caseNo || "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6 pt-2 max-h-[66vh] overflow-y-auto space-y-4">
              {/* Section: Case Identity */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                  CASE IDENTITY
                </div>

                {isLawyer ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Party Names
                      </label>
                      <input
                        value={partyNames}
                        onChange={(e) => setPartyNames(e.target.value)}
                        placeholder="e.g. Y L N R Vs. NSF"
                        className="h-11 rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Case Status
                      </label>
                      <select
                        value={caseStatus}
                        onChange={(e) => setCaseStatus(e.target.value)}
                        className="h-11 rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        {STATUS_LIST.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-muted-foreground mt-1">
                        {STATUS_META[caseStatus]?.meaning}
                      </div>
                    </div>

                    {caseStatus === "CNR Generated" && (
                      <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          CNR No.
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={cnr}
                            onChange={(e) => handleCnrChange(e.target.value)}
                            placeholder="e.g. TSNI08..."
                            className="h-11 flex-1 rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <div className="flex shrink-0 gap-2">
                            <Button
                              variant="tonal"
                              icon={<Download className="h-4 w-4" />}
                              onClick={handleImportCnr}
                              disabled={!cnr.trim()}
                            >
                              Import
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Party Names
                        </span>
                        <div className="text-base font-semibold text-foreground mt-0.5">
                          {partyNames || "—"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Case No.
                        </span>
                        <div className="text-sm font-mono font-medium text-foreground mt-0.5">
                          {caseNo || "—"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          CNR No.
                        </span>
                        <div className="text-sm font-mono font-medium text-foreground mt-0.5">
                          {cnr || "—"}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Case Status
                        </span>
                        <div className="mt-1">
                          <StatusBadge status={caseStatus} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Stage History — shown to both roles while the case is still in the pre-CNR pipeline */}
              {editingCase &&
                PRE_CNR_STAGES.includes(STORED_STATUS_TO_FILTER[caseStatus] ?? caseStatus) && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                      STAGE HISTORY
                    </div>
                    <div className="relative border-l-2 border-border ml-3 space-y-3.5 pl-6 py-1">
                      {getStageHistory(editingCase).map((stage) => (
                        <div key={stage.key} className="relative">
                          <span
                            className={`absolute -left-[29px] top-0.5 h-[14px] w-[14px] rounded-full border-2 ${
                              stage.at
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/50 bg-card"
                            }`}
                          />
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={`text-xs font-semibold ${
                                stage.isCurrent
                                  ? "text-primary"
                                  : stage.at
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {stage.label}
                              {stage.isCurrent && (
                                <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-primary">
                                  Current
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                              {stage.at
                                ? `${fmtDate(stage.at)}${stage.time ? ", " + stage.time : ""}`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(STORED_STATUS_TO_FILTER[caseStatus] ?? caseStatus) === "CNR Generated" && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            isLawyer
                              ? { to: "/lawyer/cases/$id", params: { id: editingCase.id } }
                              : { to: "/citizen/cases/$id", params: { id: editingCase.id } },
                          )
                        }
                        className="mt-3.5 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        View Details <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

              {/* Section: Case Roadmap — Part 2 of the case journey (Lawyer to
                  Court), shaped like eCourts' own case-history table.
                  Citizen view only. */}
              {!isLawyer && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                    CASE ROADMAP
                  </div>

                  {courtHistoryRows.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic py-2">
                      No hearings logged yet.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-border ml-3 space-y-4 pl-6 py-1">
                      {[...courtHistoryRows].reverse().map((e) => {
                        const idx = courtHistoryRows.findIndex((x) => x.id === e.id);
                        const filterKey = STORED_STATUS_TO_FILTER[caseStatus] ?? caseStatus;
                        const ACTIVE_STATUSES = [
                          "Pending by Lawyer",
                          "Accepted by Lawyer",
                          "Registered",
                          "Pending",
                        ];
                        const caseClosed = !ACTIVE_STATUSES.includes(filterKey);
                        const isLast = idx === courtHistoryRows.length - 1;
                        const isClosedEntry = caseClosed && isLast;
                        const effectiveDate = e.hearingDate ?? e.businessOnDate;
                        const isPast = effectiveDate < today && !isClosedEntry;

                        const closedLabel =
                          STATUS_META[filterKey]?.label ??
                          STATUS_META[caseStatus]?.label ??
                          "CLOSED";

                        const badgeLabel = isClosedEntry ? closedLabel : isPast ? "Past" : "Next";

                        let cardStyle = "border-border bg-card text-foreground";
                        let dotStyle = "border-muted-foreground bg-card";
                        let badgeStyle = "bg-[#e6e0e9] text-[#49454f]";

                        if (isClosedEntry) {
                          cardStyle = "border-[#2e6e3e] bg-[#D9F2DD] text-[#0B3818]";
                          dotStyle = "border-[#2e6e3e] bg-[#D9F2DD]";
                          badgeStyle = "bg-[#2e6e3e] text-white";
                        } else if (!isPast) {
                          cardStyle = "border-primary bg-[#EADDFF] text-[#21005D]";
                          dotStyle = "border-primary bg-[#EADDFF]";
                          badgeStyle = "bg-primary text-white";
                        }

                        return (
                          <div key={e.id} className="relative">
                            <span
                              className={`absolute -left-[35px] top-3.5 h-[18px] w-[18px] rounded-full border-2 ${dotStyle}`}
                            />

                            <div
                              className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 ${cardStyle}`}
                            >
                              <div className="space-y-1 text-xs">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11.5px]">
                                  <div>
                                    <span className="opacity-70">Business on Date:</span>{" "}
                                    <span className="font-mono font-semibold">
                                      {fmtDate(e.businessOnDate)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="opacity-70">Hearing Date:</span>{" "}
                                    <span className="font-mono font-semibold">
                                      {e.hearingDate ? fmtDate(e.hearingDate) : "—"}
                                    </span>
                                  </div>
                                </div>
                                {e.judge && (
                                  <div className="text-[12px]">
                                    <span className="opacity-70">Judge:</span> {e.judge}
                                  </div>
                                )}
                                {e.purposeOfListing && (
                                  <div className="leading-relaxed text-[12.5px]">
                                    <span className="opacity-70">Purpose of Listing:</span>{" "}
                                    {e.purposeOfListing}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${badgeStyle}`}
                                >
                                  {badgeLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center justify-between p-6 pt-3 border-t border-border/80">
              <div>
                {isLawyer && (
                  <Button variant="text" onClick={handleDeleteCase} className="text-destructive">
                    Delete Case
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="text" onClick={() => setDialogOpen(false)}>
                  {isLawyer ? "Cancel" : "Close"}
                </Button>
                {isLawyer && <Button onClick={handleSaveCase}>Save Case</Button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CNR Import Result Popup — nested above the edit dialog */}
      {cnrImportResult && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCnrImportResult(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[var(--md-sys-color-surface-container-low,#f5f3f7)] shadow-2xl border border-border/80 p-6 text-foreground">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  cnrImportResult.status === "found"
                    ? "bg-[var(--md-extended-color-success)]/10 text-[var(--md-extended-color-success)]"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {cnrImportResult.status === "found" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </span>
              <h3 className="text-base font-bold text-foreground">
                {cnrImportResult.status === "found" ? "Case Imported" : "No Match Found"}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {cnrImportResult.status === "found" && cnrImportResult.source === "database" ? (
                <>
                  Already in our database — matched <strong>"{cnrImportResult.title}"</strong>. No
                  need to fetch from eCourts.
                </>
              ) : cnrImportResult.status === "found" ? (
                <>
                  Fetched from eCourts and saved to our database — matched{" "}
                  <strong>"{cnrImportResult.title}"</strong>. The next import for this CNR will be
                  served from our records instead of eCourts.
                </>
              ) : (
                "No matching case found in our database or eCourts for this CNR."
              )}
            </p>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => setCnrImportResult(null)}>OK</Button>
            </div>
          </div>
        </div>
      )}

      {/* Attachments Modal */}
      {attachmentsCase && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:p-6 overflow-y-auto backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAttachmentsModal();
          }}
        >
          <div className="my-6 w-full max-w-[640px] rounded-[28px] bg-[var(--md-sys-color-surface-container-low,#f5f3f7)] shadow-2xl border border-border/80 overflow-hidden text-foreground">
            <div className="flex items-start justify-between gap-4 p-6 pb-2">
              <div>
                <h2 className="text-2xl font-normal text-foreground leading-snug">Attachments</h2>
                <div className="text-xs text-muted-foreground mt-1">
                  {attachmentsCase.title || "Untitled Matter"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeAttachmentsModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 pt-2 max-h-[66vh] overflow-y-auto space-y-4">
              {/* Case Description */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
                  Case Description
                </div>
                <div className="rounded-2xl border border-border bg-card p-3.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {attachmentsCase.description || "No description provided."}
                </div>
              </div>

              {/* Documents / Images */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
                  Documents &amp; Images ({attachmentsCase.files.files.length})
                </div>
                {attachmentsCase.files.files.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No attachments uploaded yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {attachmentsCase.files.files.map((d) => {
                      const isImage = d.fileMimeType?.startsWith("image/");
                      return (
                        <li
                          key={d.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              {isImage ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div
                                className="truncate text-xs font-semibold text-foreground"
                                title={d.name}
                              >
                                {d.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {d.size} · {d.uploadedAt}
                                {d.uploadedBy ? ` · added by ${d.uploadedBy}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewDoc(d);
                                setPreviewFullScreen(false);
                              }}
                              title="Preview"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <a
                              href={
                                d.fileDataUrl ??
                                `data:text/plain;charset=utf-8,${encodeURIComponent(d.name)}`
                              }
                              download={d.fileDataUrl ? d.name : `${d.name}.txt`}
                              title="Download"
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Add Attachment — citizen only; lawyer is view/download only */}
              {!isLawyer && (
                <div className="rounded-2xl bg-[var(--md-sys-color-surface-container,#efedf1)] p-4 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Add Attachment
                  </div>
                  <input
                    ref={addAttachmentInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleAddAttachments}
                  />
                  <Button
                    variant="tonal"
                    icon={<Paperclip className="h-4 w-4" />}
                    onClick={() => addAttachmentInputRef.current?.click()}
                    disabled={isUploadingAttachment}
                  >
                    {isUploadingAttachment ? "Uploading…" : "Choose Files"}
                  </Button>
                  {attachmentError && (
                    <p className="text-[11px] font-semibold text-destructive">{attachmentError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-6 pt-3 border-t border-border/80">
              <Button variant="text" onClick={closeAttachmentsModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal — nested above the Attachments modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewDoc(null);
          }}
        >
          <div
            className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl transition-all ${
              previewFullScreen ? "h-full w-full" : "max-h-[85vh] w-full max-w-2xl"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {previewDoc.fileMimeType?.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </span>
                <span
                  className="truncate text-xs font-bold text-foreground"
                  title={previewDoc.name}
                >
                  {previewDoc.name}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconButton
                  ariaLabel={previewFullScreen ? "Exit full screen" : "Full screen"}
                  onClick={() => setPreviewFullScreen((v) => !v)}
                >
                  {previewFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </IconButton>
                <IconButton ariaLabel="Close preview" onClick={() => setPreviewDoc(null)}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
              <DocumentPreviewBody
                fileDataUrl={previewDoc.fileDataUrl}
                fileMimeType={previewDoc.fileMimeType}
                fileName={previewDoc.name}
                fallback={
                  docLooksLikeImage(previewDoc) ? (
                    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-background p-6 shadow-sm">
                      <div className="flex h-56 w-full items-center justify-center rounded-lg border border-dashed border-border bg-linear-to-br from-muted to-muted/50">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/60" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-foreground">{previewDoc.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {previewDoc.size} · Uploaded {previewDoc.uploadedAt}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-border bg-background p-8 text-foreground shadow-sm">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Case Attachment
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {previewDoc.size}
                        </span>
                      </div>

                      <div className="space-y-1 py-2 text-center">
                        <h4 className="text-sm font-bold uppercase tracking-wide text-foreground">
                          {docDisplayTitle(previewDoc)}
                        </h4>
                        <p className="font-mono text-xs text-muted-foreground">
                          Uploaded {previewDoc.uploadedAt}
                          {previewDoc.uploadedBy ? ` · by ${previewDoc.uploadedBy}` : ""}
                        </p>
                      </div>

                      <div className="space-y-4 text-xs leading-relaxed text-foreground/90">
                        <p className="rounded-xl border border-border/50 bg-muted/40 p-4 font-sans">
                          This document was submitted as part of the case record for{" "}
                          <strong>{previewDoc.name}</strong>. It forms supporting evidence relevant
                          to the matter and has been indexed for reference by both the citizen and
                          the assigned Lawyer.
                        </p>
                        <p>
                          1. All statements and enclosures contained herein are submitted in good
                          faith and are subject to verification by the concerned authority.
                        </p>
                        <p>
                          2. Parties are advised to review the complete original file — available
                          via Download — before relying on this document at any hearing.
                        </p>
                      </div>

                      <div className="flex items-end justify-between border-t border-border pt-6 text-[11px] text-muted-foreground">
                        <div>
                          <p className="font-bold text-foreground">ATTACHMENT RECORD</p>
                          <p>{previewDoc.name}</p>
                        </div>
                        <div className="text-right font-mono">
                          <p>CloseUrCase FILE</p>
                          <p>ADDED {previewDoc.uploadedAt}</p>
                        </div>
                      </div>
                    </div>
                  )
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
