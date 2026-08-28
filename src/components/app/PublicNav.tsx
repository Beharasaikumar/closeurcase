import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { LAWYER_PRACTICE_AREAS } from "@/components/app/lawyerPracticeAreas";

const CLOSE_DELAY_MS = 150;

/** Centered desktop nav for the public marketing header. "Find a Lawyer"
 * opens a two-pane mega-menu — practice areas on the left, hovering one
 * reveals its specializations on the right, each with its specific legal
 * services listed underneath (mirrors the practice area -> specialization ->
 * legal service taxonomy). "About" smooth-scrolls to the About section on
 * the landing page (no separate route). Both triggers are real links, so
 * they still work with JS/hover disabled or on click; hover just reveals
 * the preview. */
export function PublicNav() {
  const [lawyerMenuOpen, setLawyerMenuOpen] = useState(false);
  const [activeAreaIndex, setActiveAreaIndex] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setLawyerMenuOpen(true);
  }

  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setLawyerMenuOpen(false), CLOSE_DELAY_MS);
  }

  function closeNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setLawyerMenuOpen(false);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeNow();
    }
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) closeNow();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const activeArea = LAWYER_PRACTICE_AREAS[activeAreaIndex];

  return (
    <nav ref={navRef} className="relative hidden md:flex items-center justify-center gap-1">
      <Link
        to="/citizen-login"
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        onClick={closeNow}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-foreground transition-colors duration-150 hover:bg-muted hover:text-primary"
      >
        Find a Lawyer
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            lawyerMenuOpen ? "rotate-180" : ""
          }`}
        />
      </Link>

      <Link
        to="/"
        hash="about"
        className="rounded-lg px-3 py-2 text-xs font-semibold text-foreground transition-colors duration-150 hover:bg-muted hover:text-primary"
      >
        About
      </Link>

      <div
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        className={`absolute left-1/2 top-full z-50 w-205 max-w-[96vw] -translate-x-1/2 pt-2 transition-all duration-200 ease-out ${
          lawyerMenuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="flex">
            <div className="w-52 shrink-0 border-r border-border py-2">
              {LAWYER_PRACTICE_AREAS.map((area, i) => (
                <button
                  key={area.name}
                  type="button"
                  onMouseEnter={() => setActiveAreaIndex(i)}
                  onFocus={() => setActiveAreaIndex(i)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold transition-colors duration-150 ${
                    i === activeAreaIndex
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {area.name}
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </button>
              ))}
            </div>

            <div className="max-h-105 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {activeArea.specializations.map((spec) => (
                  <div key={spec.name}>
                    <h4 className="text-xs font-bold text-foreground">{spec.name}</h4>
                    <ul className="mt-1.5 space-y-1">
                      {spec.legalServices.map((service) => (
                        <li key={service}>
                          <Link
                            to="/citizen-login"
                            onClick={closeNow}
                            className="text-[11px] leading-relaxed text-muted-foreground transition-colors duration-150 hover:text-primary hover:underline"
                          >
                            {service}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
            <span className="text-[11px] text-muted-foreground">
              Not sure which one fits? Describe your issue and we'll match you.
            </span>
            <Link
              to="/citizen-login"
              onClick={closeNow}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors duration-150 hover:bg-primary/90"
            >
              File a Case
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
