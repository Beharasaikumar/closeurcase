import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Upload,
  BookOpen,
  Trash2,
  CheckCircle2,
  Sparkles,
  Plus,
  Search,
  Eye,
  X,
  Download,
  FileText,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { categories } from "@/data/mock";
import {
  getKnowledgeBase,
  addKnowledgeItem,
  deleteKnowledgeItem,
  subscribeToStore,
} from "@/data/appStore";
import type { KnowledgeItem, LegalCategory } from "@/types";
import { MAX_ATTACHMENT_BYTES, formatFileSize, readFileAsDataUrl } from "@/lib/files";
import {
  TextField,
  Select,
  Button,
  IconButton,
  AssistChip,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/m3";

export const Route = createFileRoute("/admin/knowledge-base")({
  component: KnowledgeBasePage,
});

const types: KnowledgeItem["type"][] = [
  "Act",
  "Rule",
  "Regulation",
  "Amendment",
  "Judgement",
  "Order",
];

function isPreviewableInline(item: KnowledgeItem): boolean {
  if (item.fileMimeType) {
    return item.fileMimeType === "application/pdf" || item.fileMimeType.startsWith("image/");
  }
  return /\.pdf$/i.test(item.fileName ?? "");
}

export function KnowledgeBasePage() {
  const [rows, setRows] = useState<KnowledgeItem[]>(getKnowledgeBase);
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activePdfModal, setActivePdfModal] = useState<KnowledgeItem | null>(null);
  // Confirm delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteItem = rows.find((r) => r.id === pendingDeleteId);

  // Upload modal form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<KnowledgeItem["type"]>("Act");
  const [cat, setCat] = useState<LegalCategory>("Criminal");
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const sync = () => setRows(getKnowledgeBase());
    return subscribeToStore(sync);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase()),
    );
  }, [rows, search]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const fileDataUrl = fileSelected ? await readFileAsDataUrl(fileSelected) : undefined;
      const sizeStr = fileSelected ? formatFileSize(fileSelected.size) : "1.8 MB";
      addKnowledgeItem({
        title,
        type,
        category: cat,
        size: sizeStr,
        fileDataUrl,
        fileName: fileSelected?.name,
        fileMimeType: fileSelected?.type,
      });

      setSuccessMsg(`"${title}" successfully indexed into Knowledge Base!`);
      setTitle("");
      setFileSelected(null);
      setShowUploadModal(false);

      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Failed to store document in Knowledge Base:", err);
      setUploadError("Failed to store the document. Try a smaller file.");
    } finally {
      setIsUploading(false);
    }
  };

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
      header: "Type",
      render: (r) => (
        <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {r.type}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category Domain",
      render: (r) => <span className="text-xs text-muted-foreground">{r.category} Law</span>,
    },
    {
      key: "uploadedAt",
      header: "Indexed On",
      render: (r) => <span className="text-xs text-muted-foreground">{r.uploadedAt}</span>,
    },
    {
      key: "size",
      header: "File Size",
      render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.size}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <AssistChip
            label="View"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setActivePdfModal(r)}
          />
          <IconButton
            ariaLabel="Remove document from index"
            onClick={() => setPendingDeleteId(r.id)}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base & Legal Indexing"
        description="Upload and index statutory acts, amendments, and landmark judgements referenced by Lawyer AI."
      />

      {/* Success alert */}
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

      {/* SEARCH BAR & SIMPLE UPLOAD BUTTON */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
        <TextField
          value={search}
          onChange={setSearch}
          placeholder="Search acts, judgements, domains…"
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-full max-w-sm"
        />
        <Button
          icon={<Plus className="h-4 w-4" />}
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
            Indexed Reference Documents ({filtered.length})
          </span>
          <span className="text-xs text-muted-foreground">Acts, Amendments & Judgements</span>
        </div>
        <DataTable
          columns={cols}
          rows={filtered}
          empty="No knowledge base documents match your search."
        />
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal} maxWidth="600px">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 w-full">
            <span className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Upload Document to Knowledge Base
            </span>
            <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setShowUploadModal(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </IconButton>
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form id="kb-upload-form" onSubmit={handleUploadSubmit} className="space-y-4">
            <TextField
              label="Document Title"
              value={title}
              onChange={setTitle}
              required
              placeholder="e.g. Bharatiya Nyaya Sanhita, 2023"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Document Type"
                value={type}
                onChange={(v) => setType(v as KnowledgeItem["type"])}
                options={types.map((t) => ({ value: t, label: t }))}
              />
              <Select
                label="Legal Domain"
                value={cat}
                onChange={(v) => setCat(v as LegalCategory)}
                options={categories.map((c) => ({ value: c, label: `${c} Law` }))}
              />
            </div>

            {/* File dropzone */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-6 py-6 text-xs text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-center">
                {fileSelected ? fileSelected.name : "Select PDF Document File"}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">
                Supported format: PDF, DOCX (Up to 4MB — stored in your browser)
              </span>
              <input
                type="file"
                accept=".pdf,.docx"
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
              (document.getElementById("kb-upload-form") as HTMLFormElement | null)?.requestSubmit()
            }
            disabled={!title.trim() || isUploading}
          >
            {isUploading ? "Uploading & Indexing…" : "Upload & Index Document"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* PDF VIEWER POPUP MODAL */}
      <Dialog
        open={activePdfModal !== null}
        onOpenChange={(open) => !open && setActivePdfModal(null)}
        maxWidth="860px"
      >
        {activePdfModal && (
          <PdfModalBody
            item={activePdfModal}
            hasRealFile={Boolean(activePdfModal.fileDataUrl)}
            fileHref={
              activePdfModal.fileDataUrl ??
              `data:text/plain;charset=utf-8,${encodeURIComponent(activePdfModal.title)}`
            }
            fileDownloadName={activePdfModal.fileName ?? `${activePdfModal.title}.txt`}
            onClose={() => setActivePdfModal(null)}
          />
        )}
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Remove Document from Index"
        message={`Are you sure you want to permanently remove "${pendingDeleteItem?.title ?? "this document"}" from the Knowledge Base? This action cannot be undone and the AI will lose access to this reference.`}
        confirmLabel="Yes, Remove Document"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) deleteKnowledgeItem(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

interface PdfModalBodyProps {
  item: KnowledgeItem;
  hasRealFile: boolean;
  fileHref: string;
  fileDownloadName: string;
  onClose: () => void;
}

function PdfModalBody({
  item,
  hasRealFile,
  fileHref,
  fileDownloadName,
  onClose,
}: PdfModalBodyProps) {
  const previewableInline = hasRealFile && isPreviewableInline(item);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-foreground truncate">{item.title}</h3>
              <p className="text-[10px] text-muted-foreground">
                {item.type} · {item.category} Law · {item.size}
              </p>
            </div>
          </div>
          {/* Hidden focus-sink: md-dialog auto-focuses the first focusable
              element on open. This invisible zero-size button absorbs that
              initial focus so the X button doesn't appear highlighted. */}
          <span tabIndex={0} aria-hidden="true" className="sr-only" />
          <div className="flex items-center gap-1 shrink-0">
            {/* Download as anchor */}
            <a
              href={fileHref}
              download={fileDownloadName}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
              title="Download document"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
            {/* Open in new tab (full screen) */}
            <a
              href={fileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <IconButton ariaLabel="Close preview" tabIndex={-1} onClick={onClose}>
              <X className="h-4 w-4 text-muted-foreground" />
            </IconButton>
          </div>
        </DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4 py-2">
          {previewableInline ? (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <iframe src={fileHref} title={item.title} className="w-full h-[500px] bg-white" />
            </div>
          ) : hasRealFile ? (
            <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-8 shadow-sm min-h-[300px] flex flex-col items-center justify-center gap-3 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">{item.fileName}</p>
              <p className="text-[11px] text-muted-foreground max-w-sm">
                Inline preview isn't available for this file type. Use Download or Open in new tab
                to view the full document.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-4 sm:p-8 shadow-sm space-y-6 text-foreground min-h-[400px]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-2">
                <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  ADMIN KNOWLEDGE BASE INDEX
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                  VERIFIED PUBLIC COPY
                </span>
              </div>

              <div className="text-center space-y-1 py-2">
                <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                  {item.title}
                </h4>
                <p className="text-[11px] text-muted-foreground font-mono">
                  DOMAIN: {item.category.toUpperCase()} LAW
                </p>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-foreground/90">
                <p className="font-semibold text-foreground">
                  STATUTORY TEXT &amp; REFERENCE PROVISIONS:
                </p>
                <p className="bg-muted/40 p-4 rounded-xl border border-border/50 font-sans">
                  This document represents an indexed statutory publication for{" "}
                  <strong>{item.title}</strong> in the CloseurCase admin legal index.
                </p>
                <p>
                  1. Provisions contained herein are automatically referenced by Lawyer AI during
                  counter-argument generation.
                </p>
                <p>2. Official gazette notification date: {item.uploadedAt}.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      <DialogFooter className="flex items-center justify-between w-full gap-2">
        <span className="text-xs text-muted-foreground">Viewing Document in Admin Viewer</span>
        <div className="flex items-center gap-2">
          <a
            href={fileHref}
            download={fileDownloadName}
            className="inline-flex sm:hidden items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close Preview
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
