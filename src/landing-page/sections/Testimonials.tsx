import { Star, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/m3";
import { SectionKicker } from "@/landing-page/SectionKicker";
import { CITIZEN_TESTIMONIALS } from "@/landing-page/constants";

export function Testimonials() {
  return (
    <section className="border-t border-slate-200/70 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-xl">
          <SectionKicker label="Citizen testimonials" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Trusted by citizens across India
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {CITIZEN_TESTIMONIALS.map((t) => (
            <Card
              key={t.name}
              variant="outlined"
              className="relative !rounded-3xl !border-slate-200/80 !bg-[#fffcf7] p-7 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:!border-[#d4af37]/25 hover:shadow-md sm:p-8"
            >
              <span className="absolute right-6 top-4 select-none font-serif text-7xl leading-none text-[#d4af37]/20">
                &rdquo;
              </span>
              <div className="relative mb-4 flex items-center gap-1 text-[#d4af37]">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#d4af37]" />
                ))}
              </div>
              <p className="relative font-serif text-base leading-relaxed text-slate-800">
                {t.quote}
              </p>
              <div className="relative mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/10 font-serif text-sm font-semibold text-[#a9853f]">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
