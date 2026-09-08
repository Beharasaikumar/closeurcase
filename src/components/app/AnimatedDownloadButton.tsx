import { useId } from "react";
import { Download } from "lucide-react";
import { usePwaInstall } from "@/lib/usePwaInstall";
import { cn } from "@/lib/utils";

interface AnimatedDownloadButtonProps {
  useBlendedHeader?: boolean;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Ultra-premium circular download button with:
 * - 24/7 continuous rotating circular text marquee ("• DOWNLOAD APP • GET APP •")
 * - Ambient gold pulsing aura ring
 * - Metallic bezel and jewel-cut center core
 * - Polished micro-interactions & PWA install trigger
 */
export function AnimatedDownloadButton({
  useBlendedHeader = false,
  className,
  size = "md",
}: AnimatedDownloadButtonProps) {
  const { promptInstall } = usePwaInstall();
  const pathId = useId();

  const isSm = size === "sm";

  return (
    <div className="relative flex items-center justify-center">
      {/* 24/7 Ambient luxury gold pulse aura */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute rounded-full animate-gold-radar",
          isSm ? "-inset-1 bg-[#d4af37]/20" : "-inset-1.5 bg-[#d4af37]/25",
        )}
      />

      <button
        type="button"
        onClick={promptInstall}
        title="Download CloseUrCase App"
        aria-label="Download CloseUrCase App"
        className={cn(
          "group relative flex shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]",
          isSm ? "h-10 w-10" : "h-[46px] w-[46px]",
          useBlendedHeader
            ? "bg-gradient-to-b from-[#131b2e] to-[#0a0d14] shadow-[0_4px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] ring-1 ring-[#d4af37]/50 hover:ring-[#d4af37] hover:shadow-[0_0_20px_rgba(212,175,55,0.35)]"
            : "bg-gradient-to-b from-[#ffffff] to-[#faf6ed] shadow-[0_4px_14px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] ring-1 ring-[#d4af37]/45 hover:ring-[#d4af37] hover:shadow-[0_0_16px_rgba(212,175,55,0.3)]",
          className,
        )}
      >
        {/* Subtle inner track circle ring */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute rounded-full border",
            isSm ? "inset-[2px]" : "inset-[3px]",
            useBlendedHeader ? "border-[#d4af37]/15" : "border-[#d4af37]/20",
          )}
        />

        {/* 24/7 continuous rotating circular text marquee on outer track */}
        <svg
          viewBox="0 0 52 52"
          className="pointer-events-none absolute inset-0 h-full w-full animate-spin-slow select-none"
          aria-hidden="true"
        >
          <defs>
            <path
              id={pathId}
              d="M 26, 26 m -19, 0 a 19,19 0 1,1 38,0 a 19,19 0 1,1 -38,0"
            />
          </defs>
          <text
            fontSize="4.4"
            letterSpacing="0.16em"
            fontWeight="800"
            fill={useBlendedHeader ? "#f0e2b8" : "#8c6b23"}
            className="uppercase transition-colors duration-300 group-hover:fill-[#d4af37]"
          >
            <textPath href={`#${pathId}`} startOffset="0%">
              ✦ DOWNLOAD APP ✦ GET APP 
            </textPath>
          </text>
        </svg>

        {/* Central circular core: Jewel-cut metallic gold gradient button */}
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full transition-all duration-300 shadow-md",
            isSm ? "h-6 w-6" : "h-7 w-7",
            "bg-gradient-to-br from-[#f3e5c0] via-[#d4af37] to-[#9a781c] text-slate-950",
            "shadow-[0_2px_8px_rgba(212,175,55,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)]",
            "group-hover:scale-105 group-hover:shadow-[0_0_14px_rgba(212,175,55,0.7),inset_0_1px_1px_rgba(255,255,255,0.8)]",
          )}
        >
          <Download
            className={cn(
              "transition-transform duration-300 group-hover:translate-y-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]",
              isSm ? "h-3.5 w-3.5" : "h-4 w-4",
            )}
            strokeWidth={2.6}
          />
        </div>
      </button>
    </div>
  );
}

