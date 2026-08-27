import { useRef, useState, useEffect } from "react";
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
import type { LegalCase, Hearing, CaseStatus, CaseDocument } from "@/types";
import { ChatButton } from "@/components/app/CaseChat";
import {
  STATUS_LIST,
  STATUS_META,
  STORED_STATUS_TO_FILTER,
  COURTS_FLAT,
  StatusBadge,
  fmtDate,
  todayISO,
  getJourney,
  getNextEntry,
  type DocketHearing,
} from "@/components/app/caseDocketShared";

function cryptoId() {
  return "c" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

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
 * everything else was freshly filed through CloseurCase itself. */
export function caseTypeOf(c: LegalCase): "New" | "Existing" {
  return c.cnrNumber ? "Existing" : "New";
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
  const [journey, setJourney] = useState<DocketHearing[]>([]);

  const [nextDate, setNextDate] = useState("");
  const [nextPlace, setNextPlace] = useState("");
  const [nextPurpose, setNextPurpose] = useState("");
  const [nextNature, setNextNature] = useState("");
  const [nextAdv, setNextAdv] = useState("");

  const isLawyer = role === "lawyer";

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    sync();
    return subscribeToStore(sync);
  }, []);

  function handleOpenModal(c: LegalCase) {
    setEditingCase(c);
    setPartyNames(c.title || "");
    setCaseNo(c.caseNumber || "");
    setCnr(c.cnrNumber || "");
    setCaseStatus(c.status || "Submitted");
    setJourney(getJourney(c));

    setNextDate("");
    setNextPlace("");
    setNextPurpose("");
    setNextNature("");
    setNextAdv("");

    setDialogOpen(true);
  }

  function handleAddNextStep() {
    if (!nextDate && !nextPlace && !nextPurpose) {
      alert("Add at least a date, place or purpose for this step.");
      return;
    }

    const newStep: DocketHearing = {
      id: cryptoId(),
      date: nextDate,
      place: nextPlace.trim(),
      purpose: nextPurpose.trim(),
      natureOfSuit: nextNature.trim(),
      adv: nextAdv.trim(),
    };

    setJourney((prev) => [...prev, newStep]);

    setNextDate("");
    setNextPlace("");
    setNextPurpose("");
    setNextNature("");
    setNextAdv("");
  }

  function handleRemoveStep(id: string) {
    setJourney((prev) => prev.filter((item) => item.id !== id));
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
    const hearingsList: Hearing[] = journey.map((j) => ({
      id: j.id,
      date: j.date,
      courtOrVenue: j.place,
      note: j.purpose,
      hearingType: j.natureOfSuit,
      Lawyer: j.adv,
      createdAt: today,
    }));

    if (editingCase) {
      const updatedCases = allCases.map((c) => {
        if (c.id !== editingCase.id) return c;
        return {
          ...c,
          title: partyNames.trim(),
          caseNumber: caseNo.trim(),
          cnrNumber: cnr.trim(),
          status: caseStatus as CaseStatus,
          hearings: hearingsList,
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
    (a.date || "9999").localeCompare(b.date || "9999"),
  );
  const attachmentsCase = attachmentsCaseId
    ? allCases.find((c) => c.id === attachmentsCaseId)
    : null;

  return (
    <>
      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        {cases.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <h3 className="text-lg font-medium text-foreground">No matching cases</h3>
            <p className="mt-1 text-xs">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-border bg-surface-container text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Party Names</th>
                  <th className="px-4 py-3">Case Type</th>
                  <th className="px-4 py-3">Next Hearing Date</th>
                  <th className="px-4 py-3">Place</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {cases.map((c) => {
                  const entry = getNextEntry(c);
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3.5 align-top">
                        <div className="font-semibold text-foreground leading-snug">
                          {c.title || "Untitled Matter"}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground mt-0.5">
                          {c.caseNumber || "No case no."}
                        </div>
                        <div
                          className={`font-mono text-[11.5px] mt-0.5 ${
                            c.cnrNumber ? "text-muted-foreground" : "text-muted-foreground/50"
                          }`}
                        >
                          {c.cnrNumber || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <CaseTypeBadge caseItem={c} />
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <div className="font-medium text-foreground">
                          {entry ? fmtDate(entry.date) : "—"}
                        </div>
                        {entry && entry.purpose && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {entry.purpose}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-top text-foreground">
                        {entry && entry.place ? entry.place : "—"}
                      </td>

                      <td className="px-4 py-3.5 align-top">
                        <StatusBadge status={c.status} />
                      </td>

                      <td className="px-4 py-3.5 text-right align-top">
                        <div className="flex items-center justify-end gap-2">
                          {isLawyer && c.status === "Submitted" ? (
                            <>
                              <IconButton title="Approve case" onClick={() => handleApprove(c)}>
                                <Check className="h-4 w-4 text-[var(--md-extended-color-success)]" />
                              </IconButton>
                              <IconButton title="Reject case" onClick={() => handleReject(c)}>
                                <X className="h-4 w-4 text-[var(--md-sys-color-error)]" />
                              </IconButton>
                            </>
                          ) : (
                            <IconButton
                              title={isLawyer ? "Edit case" : "View case details"}
                              onClick={() => handleOpenModal(c)}
                            >
                              {isLawyer ? (
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </IconButton>
                          )}
                          <IconButton
                            title={`Attachments${c.documents.length > 0 ? ` (${c.documents.length})` : ""}`}
                            onClick={() => setAttachmentsCaseId(c.id)}
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                          </IconButton>
                          {(isLawyer || c.lawyerName) && <ChatButton caseItem={c} role={role} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Case No.
                      </label>
                      <input
                        value={caseNo}
                        onChange={(e) => setCaseNo(e.target.value)}
                        placeholder="e.g. OS 4/2025"
                        className="h-11 rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        CNR No.
                      </label>
                      <input
                        value={cnr}
                        onChange={(e) => setCnr(e.target.value)}
                        placeholder="e.g. TSNI08..."
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

              {/* Section: Add Next Step (Lawyer Only) */}
              {isLawyer && (
                <div className="rounded-2xl bg-[var(--md-sys-color-surface-container,#efedf1)] p-4 my-3 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    ADD NEXT STEP
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Next Hearing Date
                      </label>
                      <input
                        type="date"
                        value={nextDate}
                        onChange={(e) => setNextDate(e.target.value)}
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Place / Court
                      </label>
                      <input
                        list="courtsList"
                        value={nextPlace}
                        onChange={(e) => setNextPlace(e.target.value)}
                        placeholder="Type or pick a court…"
                        autoComplete="off"
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Purpose
                      </label>
                      <input
                        value={nextPurpose}
                        onChange={(e) => setNextPurpose(e.target.value)}
                        placeholder="e.g. Call with IAs."
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Nature of Suit
                      </label>
                      <input
                        value={nextNature}
                        onChange={(e) => setNextNature(e.target.value)}
                        placeholder="e.g. Enquiry"
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Lawyer
                      </label>
                      <input
                        value={nextAdv}
                        onChange={(e) => setNextAdv(e.target.value)}
                        placeholder="e.g. Ramulu Bdn"
                        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <Button variant="tonal" onClick={handleAddNextStep} className="mt-2 text-xs">
                    + Add to Roadmap
                  </Button>
                </div>
              )}

              {/* Section: Case Roadmap */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                  CASE ROADMAP
                </div>

                {sortedModalJourney.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic py-2">
                    No hearings logged yet.{isLawyer ? " Add the first one above." : ""}
                  </div>
                ) : (
                  <div className="relative border-l-2 border-border ml-3 space-y-4 pl-6 py-1">
                    {[...sortedModalJourney].reverse().map((e) => {
                      const idx = sortedModalJourney.findIndex((x) => x.id === e.id);
                      const filterKey = STORED_STATUS_TO_FILTER[caseStatus] ?? caseStatus;
                      const ACTIVE_STATUSES = [
                        "Pending by Lawyer",
                        "Accepted by Lawyer",
                        "Registered",
                        "Pending",
                      ];
                      const caseClosed = !ACTIVE_STATUSES.includes(filterKey);
                      const isLast = idx === sortedModalJourney.length - 1;
                      const isClosedEntry = caseClosed && isLast;
                      const isPast = e.date && e.date < today && !isClosedEntry;

                      const closedLabel =
                        STATUS_META[filterKey]?.label ?? STATUS_META[caseStatus]?.label ?? "CLOSED";

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
                              <div className="font-mono font-semibold text-[12.5px] text-foreground">
                                {fmtDate(e.date)}
                              </div>
                              {e.place && (
                                <div className="font-semibold text-foreground leading-snug">
                                  {e.place}
                                </div>
                              )}
                              <div className="text-muted-foreground leading-relaxed text-[12.5px]">
                                {e.purpose}
                                {e.purpose && e.natureOfSuit ? " · " : ""}
                                {e.natureOfSuit}
                              </div>
                              {e.adv && (
                                <div className="text-muted-foreground text-[12px]">
                                  Adv: {e.adv}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${badgeStyle}`}
                              >
                                {badgeLabel}
                              </span>

                              {isLawyer && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(e.id)}
                                  className="text-sm text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                                  title="Remove step"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                  Documents &amp; Images ({attachmentsCase.documents.length})
                </div>
                {attachmentsCase.documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No attachments uploaded yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {attachmentsCase.documents.map((d) => {
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
              {previewDoc.fileDataUrl &&
              (previewDoc.fileMimeType === "application/pdf" ||
                previewDoc.fileMimeType?.startsWith("image/")) ? (
                <div className="mx-auto h-full max-w-2xl overflow-hidden rounded-xl border border-border bg-background">
                  <iframe
                    src={previewDoc.fileDataUrl}
                    title={previewDoc.name}
                    className="h-full min-h-[60vh] w-full bg-white"
                  />
                </div>
              ) : docLooksLikeImage(previewDoc) ? (
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
                      <strong>{previewDoc.name}</strong>. It forms supporting evidence relevant to
                      the matter and has been indexed for reference by both the citizen and the
                      assigned Lawyer.
                    </p>
                    <p>
                      1. All statements and enclosures contained herein are submitted in good faith
                      and are subject to verification by the concerned authority.
                    </p>
                    <p>
                      2. Parties are advised to review the complete original file — available via
                      Download — before relying on this document at any hearing.
                    </p>
                  </div>

                  <div className="flex items-end justify-between border-t border-border pt-6 text-[11px] text-muted-foreground">
                    <div>
                      <p className="font-bold text-foreground">ATTACHMENT RECORD</p>
                      <p>{previewDoc.name}</p>
                    </div>
                    <div className="text-right font-mono">
                      <p>CLOSEURCASE FILE</p>
                      <p>ADDED {previewDoc.uploadedAt}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
