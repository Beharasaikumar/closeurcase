import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import {
  getKnowledgeBase,
  getLawyers,
  getLawyerDocuments,
  addLawyerDocument,
  deleteLawyerDocument,
  subscribeToStore,
} from "@/data/appStore";
import type { KnowledgeItem, LawyerDocument } from "@/types";
import { MAX_ATTACHMENT_BYTES, formatFileSize, readFileAsDataUrl } from "@/lib/files";
import {
  Search,
  BookOpen,
  FileStack,
  Upload,
  Trash2,
  Download,
  FileText,
  Tag,
  RotateCcw,
  Filter,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  TextField,
  Button,
  IconButton,
  ChipSet,
  FilterChip,
  AssistChip,
  Badge,
  Tabs,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/m3";

export const Route = createFileRoute("/lawyer/knowledge-base")({
  component: LawyerKnowledgeBase,
});

type KbTab = "global" | "mine";

function isPreviewableInline(item: { fileMimeType?: string; fileName?: string }): boolean {
  if (item.fileMimeType) {
    return item.fileMimeType === "application/pdf" || item.fileMimeType.startsWith("image/");
  }
  return /\.pdf$/i.test(item.fileName ?? "");
}

export function LawyerKnowledgeBase() {
  const [tab, setTab] = useState<KbTab>("global");
  const lawyersList = getLawyers();
  const currentLawyer = lawyersList.find((l) => l.id === "l_001") || lawyersList[0];
  const myDocs = useMyDocs(currentLawyer?.id ?? "l_001");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Knowledge Base & References"
        description="Browse indexed statutory acts and landmark judgements, or keep your own reference documents handy."
      />

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as KbTab)}
        tabs={[
          { value: "global", label: "Global Docs", icon: <BookOpen className="h-4 w-4" /> },
          {
            value: "mine",
            label: `My Docs (${myDocs.docs.length})`,
            icon: <FileStack className="h-4 w-4" />,
          },
        ]}
      />

      {tab === "global" ? <GlobalDocsTab /> : <MyDocsTab state={myDocs} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   GLOBAL DOCS — admin-curated, shared knowledge base (read-only for lawyer)
═══════════════════════════════════════════════════════════════════════ */
function GlobalDocsTab() {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>(getKnowledgeBase);
  const [activePdf, setActivePdf] = useState<KnowledgeItem | null>(null);

  useEffect(() => {
    const sync = () => setItems(getKnowledgeBase());
    return subscribeToStore(sync);
  }, []);

  const availableTypes = useMemo(() => {
    const typesSet = new Set(items.map((i) => i.type).filter(Boolean));
    return ["All", ...Array.from(typesSet)];
  }, [items]);

  const availableDomains = useMemo(() => {
    const domainsSet = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(domainsSet)];
  }, [items]);

  const activeFilterCount = (typeFilter !== "All" ? 1 : 0) + (domainFilter !== "All" ? 1 : 0);

  const rows = items.filter((k) => {
    const matchesSearch =
      k.title.toLowerCase().includes(q.toLowerCase()) ||
      k.category.toLowerCase().includes(q.toLowerCase()) ||
      k.type.toLowerCase().includes(q.toLowerCase());

    const matchesType = typeFilter === "All" || k.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesDomain =
      domainFilter === "All" || k.category.toLowerCase() === domainFilter.toLowerCase();

    return matchesSearch && matchesType && matchesDomain;
  });

  const cols: Column<KnowledgeItem>[] = [
    {
      key: "title",
      header: "Document Title",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground text-xs">{r.title}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Document Type",
      render: (r) => (
        <span className="inline-block rounded-md bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
          {r.type}
        </span>
      ),
    },
    {
      key: "category",
      header: "Domain",
      render: (r) => (
        <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground">
          {r.category}
        </span>
      ),
    },
    {
      key: "date",
      header: "Uploaded Date",
      render: (r) => <span className="text-xs text-muted-foreground">{r.uploadedAt}</span>,
    },
    {
      key: "size",
      header: "File Size",
      render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.size}</span>,
    },
    {
      key: "action",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <AssistChip
            label="View"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setActivePdf(r)}
          />
          <AssistChip
            label="Download"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() => alert(`Downloading reference document: ${r.title}`)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOP SEARCH & FILTER TOGGLE BAR */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TextField
            value={q}
            onChange={setQ}
            placeholder="Search acts, judgements, keywords…"
            leadingIcon={<Search className="h-4 w-4" />}
            className="w-full max-w-sm"
          />

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant={showFilters || activeFilterCount > 0 ? "filled" : "outlined"}
                icon={<Filter className="h-4 w-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="inline-flex items-center gap-1">
                  Filter
                  {showFilters ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </Button>
              {activeFilterCount > 0 && <Badge count={activeFilterCount} />}
            </div>

            {(typeFilter !== "All" || domainFilter !== "All" || q) && (
              <Button
                variant="text"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  setTypeFilter("All");
                  setDomainFilter("All");
                  setQ("");
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* COLLAPSIBLE FILTERS PANEL — LIVES UNDER FILTER BUTTON */}
        {showFilters && (
          <div className="border-t border-border pt-4 space-y-4 animate-in fade-in duration-150">
            {/* Document Type Filter Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Document Type:</span>
              </div>
              <ChipSet>
                {availableTypes.map((type) => (
                  <FilterChip
                    key={type}
                    label={type === "All" ? "All Types" : type}
                    selected={typeFilter.toLowerCase() === type.toLowerCase()}
                    onClick={() => setTypeFilter(type)}
                  />
                ))}
              </ChipSet>
            </div>

            {/* Legal Domain Filter Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Legal Domain:</span>
              </div>
              <ChipSet>
                {availableDomains.map((domain) => (
                  <FilterChip
                    key={domain}
                    label={domain === "All" ? "All Domains" : `${domain} Law`}
                    selected={domainFilter.toLowerCase() === domain.toLowerCase()}
                    onClick={() => setDomainFilter(domain)}
                  />
                ))}
              </ChipSet>
            </div>
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-3">
        <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-xs font-bold text-foreground">
            Reference Documents ({rows.length})
          </span>
          <span className="text-xs text-muted-foreground">Showing verified legal publications</span>
        </div>
        <DataTable
          columns={cols}
          rows={rows}
          empty="No knowledge base documents match your filter criteria."
        />
      </div>

      {/* PDF VIEWER POPUP MODAL */}
      {activePdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-4 bg-surface">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-foreground">{activePdf.title}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {activePdf.type} · {activePdf.category} Law · {activePdf.size}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={
                    activePdf.fileDataUrl ??
                    `data:text/plain;charset=utf-8,${encodeURIComponent(activePdf.title)}`
                  }
                  download={activePdf.fileName ?? `${activePdf.title}.txt`}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                  title="Download document"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
                <a
                  href={
                    activePdf.fileDataUrl ??
                    `data:text/plain;charset=utf-8,${encodeURIComponent(activePdf.title)}`
                  }
                  download={activePdf.fileName ?? `${activePdf.title}.txt`}
                  className="flex h-9 w-9 sm:hidden items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </a>
                <a
                  href={
                    activePdf.fileDataUrl ??
                    `data:text/plain;charset=utf-8,${encodeURIComponent(activePdf.title)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  title="Open in new tab (full screen)"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
                <IconButton ariaLabel="Close preview" onClick={() => setActivePdf(null)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            </div>

            {/* Modal Body — Document Content Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/30 space-y-4">
              {activePdf.fileDataUrl && isPreviewableInline(activePdf) ? (
                <div className="mx-auto h-full max-w-3xl overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                  <iframe
                    src={activePdf.fileDataUrl}
                    title={activePdf.title}
                    className="h-[70vh] w-full bg-white"
                  />
                </div>
              ) : activePdf.fileDataUrl ? (
                <div className="mx-auto flex max-w-2xl min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background p-8 text-center shadow-sm">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">{activePdf.fileName}</p>
                  <p className="max-w-sm text-[11px] text-muted-foreground">
                    Inline preview isn't available for this file type. Use Download or Open in new
                    tab to view the full document.
                  </p>
                </div>
              ) : (
                <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-8 shadow-sm space-y-6 text-foreground min-h-[500px]">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                      OFFICIAL GAZETTE / LEGAL REFERENCE
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">STATUTORY COPY</span>
                  </div>

                  <div className="text-center space-y-1 py-2">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                      {activePdf.title}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      DOMAIN: {activePdf.category.toUpperCase()} LAW
                    </p>
                  </div>

                  <div className="space-y-4 text-xs leading-relaxed text-foreground/90">
                    <p className="font-semibold text-foreground">
                      STATUTORY PROVISIONS &amp; STATUTORY REFERENCES:
                    </p>
                    <p className="bg-muted/40 p-4 rounded-xl border border-border/50 font-sans">
                      This document represents an indexed statutory text reference for{" "}
                      <strong>{activePdf.title}</strong>, maintained in the CloseurCase legal
                      knowledge base. Lawyers can cite these sections directly in AI counter
                      generation.
                    </p>
                    <p>
                      1. Under the applicable provisions, all registered petitions and legal notices
                      must conform to statutory timelines and jurisdictional prerequisites.
                    </p>
                    <p>
                      2. Certified copies of orders and evidentiary exhibits shall be produced
                      before the presiding tribunal during preliminary hearing proceedings.
                    </p>
                  </div>

                  <div className="pt-8 border-t border-border flex justify-between items-end text-[11px] text-muted-foreground">
                    <div>
                      <p className="font-bold text-foreground">INDEXED REFERENCE:</p>
                      <p>{activePdf.type}</p>
                    </div>
                    <div className="text-right font-mono">
                      <p>VERIFIED DOCUMENT</p>
                      <p>UPLOADED: {activePdf.uploadedAt}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-2 border-t border-border px-4 sm:px-6 py-3 bg-surface sm:flex-row sm:items-center sm:justify-between">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Viewing PDF in CloseurCase Viewer
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

/* ═══════════════════════════════════════════════════════════════════════
   MY DOCS — the lawyer's own personal reference documents
═══════════════════════════════════════════════════════════════════════ */
function useMyDocs(lawyerId: string) {
  const [docs, setDocs] = useState<LawyerDocument[]>(() => getLawyerDocuments(lawyerId));

  useEffect(() => {
    const sync = () => setDocs(getLawyerDocuments(lawyerId));
    sync();
    return subscribeToStore(sync);
  }, [lawyerId]);

  return { lawyerId, docs };
}

function MyDocsTab({ state }: { state: { lawyerId: string; docs: LawyerDocument[] } }) {
  const { lawyerId, docs } = state;
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeDoc, setActiveDoc] = useState<LawyerDocument | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteDoc = docs.find((d) => d.id === pendingDeleteId);

  const [title, setTitle] = useState("");
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadError, setUploadError] = useState("");

  const filtered = useMemo(
    () => docs.filter((d) => d.title.toLowerCase().includes(search.toLowerCase())),
    [docs, search],
  );

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const fileDataUrl = fileSelected ? await readFileAsDataUrl(fileSelected) : undefined;
      const sizeStr = fileSelected ? formatFileSize(fileSelected.size) : "—";
      addLawyerDocument({
        lawyerId,
        title,
        size: sizeStr,
        fileDataUrl,
        fileName: fileSelected?.name,
        fileMimeType: fileSelected?.type,
      });

      setSuccessMsg(`"${title}" added to your documents.`);
      setTitle("");
      setFileSelected(null);
      setShowUploadModal(false);

      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Failed to store personal document:", err);
      setUploadError("Failed to store the document. Try a smaller file.");
    } finally {
      setIsUploading(false);
    }
  };

  const cols: Column<LawyerDocument>[] = [
    {
      key: "title",
      header: "Document Title",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground text-xs">{r.title}</span>
        </div>
      ),
    },
    {
      key: "date",
      header: "Uploaded Date",
      render: (r) => <span className="text-xs text-muted-foreground">{r.uploadedAt}</span>,
    },
    {
      key: "size",
      header: "File Size",
      render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.size}</span>,
    },
    {
      key: "action",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <AssistChip
            label="View"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setActiveDoc(r)}
          />
          <IconButton ariaLabel={`Delete ${r.title}`} onClick={() => setPendingDeleteId(r.id)}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {successMsg && (
        <div
          className="flex items-center gap-2 rounded-lg p-4 text-xs font-bold"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--md-extended-color-success) 10%, transparent)",
            color: "var(--md-extended-color-success)",
          }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEARCH BAR & UPLOAD BUTTON */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
        <TextField
          value={search}
          onChange={setSearch}
          placeholder="Search your documents…"
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-full max-w-sm"
        />
        <Button
          icon={<Upload className="h-4 w-4" />}
          onClick={() => {
            setUploadError("");
            setShowUploadModal(true);
          }}
        >
          Upload Document
        </Button>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-bold text-foreground">
            Your Documents ({filtered.length})
          </span>
          <span className="text-xs text-muted-foreground">Only visible to you</span>
        </div>
        <DataTable
          columns={cols}
          rows={filtered}
          empty="You haven't uploaded any documents yet — use Upload Document to add one."
        />
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal} maxWidth="600px">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 w-full">
            <span className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Upload to My Docs
            </span>
            <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setShowUploadModal(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </IconButton>
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form id="my-docs-upload-form" onSubmit={handleUploadSubmit} className="space-y-4">
            <TextField
              label="Document Title"
              value={title}
              onChange={setTitle}
              required
              placeholder="e.g. Draft Reply — Property Boundary Notice"
            />

            {/* File dropzone */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-6 py-6 text-xs text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-center">
                {fileSelected ? fileSelected.name : "Select a File"}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">
                Any document type, up to 4MB — stored in your browser
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > MAX_ATTACHMENT_BYTES) {
                    setUploadError("File is too large — please select a file under 4MB.");
                    setFileSelected(null);
                    e.target.value = "";
                    return;
                  }
                  setUploadError("");
                  setFileSelected(f);
                }}
              />
            </label>
            {uploadError && (
              <p className="text-[11px] font-semibold text-destructive">{uploadError}</p>
            )}
          </form>
        </DialogContent>
        <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 w-full">
          <Button
            variant="outlined"
            onClick={() => setShowUploadModal(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            onClick={() =>
              (
                document.getElementById("my-docs-upload-form") as HTMLFormElement | null
              )?.requestSubmit()
            }
            disabled={!title.trim() || isUploading}
          >
            {isUploading ? "Uploading…" : "Upload Document"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* DOCUMENT VIEWER MODAL */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-4 bg-surface">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-foreground">{activeDoc.title}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {activeDoc.size} · Uploaded {activeDoc.uploadedAt}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {activeDoc.fileDataUrl && (
                  <a
                    href={activeDoc.fileDataUrl}
                    download={activeDoc.fileName}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                    title="Download document"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                )}
                <IconButton ariaLabel="Close preview" onClick={() => setActiveDoc(null)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-muted/30 space-y-4">
              {activeDoc.fileDataUrl && isPreviewableInline(activeDoc) ? (
                <div className="mx-auto h-full max-w-3xl overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                  <iframe
                    src={activeDoc.fileDataUrl}
                    title={activeDoc.title}
                    className="h-[70vh] w-full bg-white"
                  />
                </div>
              ) : (
                <div className="mx-auto flex max-w-2xl min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background p-8 text-center shadow-sm">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">
                    {activeDoc.fileName ?? activeDoc.title}
                  </p>
                  <p className="max-w-sm text-[11px] text-muted-foreground">
                    Inline preview isn't available for this file type. Use Download to view the full
                    document.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border px-4 sm:px-6 py-3 bg-surface sm:flex-row sm:items-center sm:justify-between">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Viewing document in CloseurCase Viewer
              </span>
              <Button onClick={() => setActiveDoc(null)} className="w-full sm:w-auto">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${pendingDeleteDoc?.title ?? "this document"}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) deleteLawyerDocument(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
