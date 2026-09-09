import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** Floating "back to top" control for the marketing landing page. Appears once
 * the user has scrolled past the hero and smooth-scrolls the window to the top
 * on click. Mounted only by the landing route, so it never collides with the
 * dashboard's floating widgets (LexBot / WhatsApp). */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      title="Scroll to top"
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full",
        "border border-[#d4af37]/50 bg-gradient-to-br from-[#e8d5a3] via-[#d4af37] to-[#b8942a]",
        "text-slate-950 shadow-lg shadow-[#d4af37]/25 transition-all duration-300",
        "hover:from-[#f0e0b0] hover:to-[#c9a84c] hover:shadow-xl active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.4} />
    </button>
  );
}
