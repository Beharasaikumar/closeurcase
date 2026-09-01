import { useEffect, useRef, useState } from "react";
import { renderAsync as renderDocxAsync } from "docx-preview";
import { FileText } from "lucide-react";

const DOCX_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function looksLikePdf(fileName: string, fileMimeType?: string): boolean {
  if (fileMimeType) return fileMimeType === "application/pdf";
  return /\.pdf$/i.test(fileName);
}

function looksLikeImage(fileName: string, fileMimeType?: string): boolean {
  if (fileMimeType) return fileMimeType.startsWith("image/");
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName);
}

function looksLikeDocx(fileName: string, fileMimeType?: string): boolean {
  if (fileMimeType) return DOCX_MIME_TYPES.has(fileMimeType);
  return /\.docx?$/i.test(fileName);
}

/** Renders a .doc/.docx file's actual content client-side (docx-preview
 * converts it straight to HTML/CSS in the browser — no server round-trip,
 * matching this app's localStorage-only data layer). */
export function DocxPreview({ fileDataUrl, fileName }: { fileDataUrl: string; fileName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const container = containerRef.current;
    if (container) container.innerHTML = "";

    fetch(fileDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled || !container) return;
        return renderDocxAsync(blob, container, undefined, {
          ignoreWidth: true,
          ignoreHeight: true,
        });
      })
      .catch((err) => {
        console.error(`Failed to render "${fileName}" as a Word document:`, err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [fileDataUrl, fileName]);

  if (failed) {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <FileText className="h-8 w-8 text-muted-foreground/60" />
        <p>Couldn't render a preview for this document. Use Full Screen to view it.</p>
      </div>
    );
  }

  return <div ref={containerRef} />;
}

/**
 * Shared fullscreen preview body for any uploaded file across the app (case
 * attachments, admin Knowledge Base, lawyer Knowledge Base) — real rendering
 * for PDFs, images, and .doc/.docx; a "no inline preview" message for
 * anything else; and `fallback` for the no-real-file case (seed/mock items
 * that only carry a name, no actual bytes).
 */
export function DocumentPreviewBody({
  fileDataUrl,
  fileMimeType,
  fileName,
  fallback,
}: {
  fileDataUrl?: string;
  fileMimeType?: string;
  fileName: string;
  fallback: React.ReactNode;
}) {
  if (!fileDataUrl) return <>{fallback}</>;

  if (looksLikePdf(fileName, fileMimeType)) {
    return (
      <div className="mx-auto h-[60vh] sm:h-[70vh] w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <iframe src={fileDataUrl} title={fileName} className="h-full w-full bg-white border-0" />
      </div>
    );
  }

  if (looksLikeImage(fileName, fileMimeType)) {
    return (
      <div className="mx-auto flex max-h-[60vh] sm:max-h-[70vh] max-w-3xl items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2 shadow-sm">
        <img
          src={fileDataUrl}
          alt={fileName}
          className="max-h-[58vh] sm:max-h-[68vh] w-auto max-w-full rounded-lg object-contain"
        />
      </div>
    );
  }

  if (looksLikeDocx(fileName, fileMimeType)) {
    return (
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-background p-1.5 sm:p-4 shadow-sm">
        <DocxPreview fileDataUrl={fileDataUrl} fileName={fileName} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[300px] max-w-2xl flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background p-8 text-center shadow-sm">
      <FileText className="h-8 w-8 text-muted-foreground" />
      <p className="text-xs font-semibold text-foreground">{fileName}</p>
      <p className="max-w-sm text-[11px] text-muted-foreground">
        Inline preview isn't available for this file type. Use Full Screen to view the full document.
      </p>
    </div>
  );
}
