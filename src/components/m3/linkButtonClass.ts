/**
 * Tailwind classes matching the M3 filled-button spec, for places that need
 * router `<Link>` navigation (so it must stay a real anchor for prefetch /
 * open-in-new-tab / no full-page-reload) rather than the md-filled-button
 * custom element, which would lose that behavior.
 */
export const FILLED_LINK_BUTTON_CLASS =
  "inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-6 text-sm font-medium text-[var(--md-sys-color-on-primary)] transition-opacity hover:opacity-90 active:opacity-80";

export const OUTLINED_LINK_BUTTON_CLASS =
  "inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[var(--md-sys-color-outline)] px-6 text-sm font-medium text-[var(--md-sys-color-primary)] transition-colors hover:bg-[var(--md-sys-color-primary)]/8";

export const TEXT_LINK_BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-[var(--md-sys-color-primary)] transition-colors hover:bg-[var(--md-sys-color-primary)]/8";
