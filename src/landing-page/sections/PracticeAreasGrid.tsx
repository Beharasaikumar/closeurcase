import { cn } from "@/lib/utils";
import { SectionKicker } from "@/landing-page/SectionKicker";
import { goldIconCircle } from "@/landing-page/theme";
import { PRACTICE_GRID } from "@/landing-page/constants";

export function PracticeAreasGrid() {
  return (
    <section className="border-t border-slate-200/70 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-xl">
          <SectionKicker label="Legal practice areas" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Comprehensive legal coverage
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRACTICE_GRID.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3.5 rounded-2xl border border-slate-200/70 bg-white/70 p-4 transition-colors hover:border-[#d4af37]/25 hover:bg-[#fffcf7]"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    goldIconCircle,
                  )}
                >
                  <IconComp className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
