import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button, TextField } from "@/components/m3";
import { goldButtonStyle } from "@/landing-page/theme";

export function FinalCta() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  }

  return (
    <section id="contact" className="scroll-mt-20 bg-[#faf8f4] py-6 sm:py-8">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/25 bg-gradient-to-b from-[#0a0d14] to-[#121929] p-8 shadow-2xl shadow-[#0a0d14]/20 sm:p-12">
          <p
            aria-hidden
            className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-serif text-[18vw] font-semibold italic leading-none text-[#d4af37]/[0.06] sm:text-[12vw]"
          >
            Justice.
          </p>
          <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-5 text-center lg:text-left">
              <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                Resolve your legal matter with bar verified Advocates
              </h2>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-300/80 lg:mx-0">
                Get matched to a qualified Lawyer today. Confidential, transparent, and tracked at
                every step.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle2 className="h-9 w-9 text-[#d4af37]" />
                  <p className="font-serif text-lg font-semibold text-white">Thank you</p>
                  <p className="max-w-xs text-sm text-slate-300/80">
                    We&apos;ve received your message and will get back to you shortly.
                  </p>
                  <Button
                    variant="text"
                    className="!text-[#d4af37]"
                    onClick={() => setSubmitted(false)}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <TextField
                    label="Full name"
                    value={name}
                    onChange={setName}
                    required
                    className="w-full"
                    style={contactFieldStyle}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                    className="w-full"
                    style={contactFieldStyle}
                  />
                  <TextField
                    label="Phone number"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    required
                    className="w-full"
                    style={contactFieldStyle}
                  />
                  <TextField
                    label="How can we help?"
                    type="textarea"
                    rows={3}
                    value={message}
                    onChange={setMessage}
                    required
                    className="w-full"
                    style={contactFieldStyle}
                  />
                  <Button
                    type="submit"
                    variant="filled"
                    style={goldButtonStyle}
                    className="!w-full !rounded-full !py-3.5 !text-sm font-semibold shadow-lg shadow-[#d4af37]/20 transition-transform active:scale-[0.98]"
                    trailingIcon
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    Submit
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const contactFieldStyle = {
  "--md-outlined-text-field-outline-color": "rgba(255,255,255,0.2)",
  "--md-outlined-text-field-hover-outline-color": "rgba(212,175,55,0.5)",
  "--md-outlined-text-field-focus-outline-color": "#d4af37",
  "--md-outlined-text-field-label-text-color": "rgba(255,255,255,0.6)",
  "--md-outlined-text-field-input-text-color": "#ffffff",
  "--md-outlined-text-field-focus-label-text-color": "#d4af37",
} as CSSProperties;
