import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Building2,
  ShieldCheck,
  UserCheck,
  Scale,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — CloseurCase Legal Platform" },
      {
        name: "description",
        content:
          "Get in touch with CloseurCase support for inquiries, lawyer registration help, and technical assistance.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="border-b border-border bg-surface/60 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>We're Here to Help</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Get in Touch with CloseurCase
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Have a question about filing a case, Lawyer verification, or platform features? Send us
            a message and our team will get back to you promptly.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Contact Information & Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Contact Information</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Reach out directly via email, phone, or submit the contact form.
              </p>
            </div>

            <div className="space-y-4">
              {/* Card 1: Support Email */}
              <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Us
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    support@closeurcase.com
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    For general support & onboarding assistance
                  </p>
                </div>
              </div>

              {/* Card 2: Helpline */}
              <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Call Support
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    +1 (800) 555-CASE (2273)
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Monday – Friday, 9:00 AM – 6:00 PM EST
                  </p>
                </div>
              </div>

              {/* Card 3: Office Headquarters */}
              <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Headquarters
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Legal Tech Plaza, Suite 400
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Washington, D.C., 20001</p>
                </div>
              </div>

              {/* Card 4: Response Guarantee */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-800">Quick Response Time</div>
                    <div className="text-[11px] text-emerald-700">
                      Average response within 2–4 business hours
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Fast
                </span>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Need Immediate Answers?</span>
              </h4>
              <p className="text-xs text-muted-foreground">
                Check our platform overview or role signup options:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  to="/about"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <span>About Platform</span>
                  <span className="text-[10px]">→</span>
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <span>Citizen Sign Up</span>
                  <span className="text-[10px]">→</span>
                </Link>
                <Link
                  to="/lawyer-register"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <span>Lawyer Signup</span>
                  <span className="text-[10px]">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                <MessageSquare className="h-4 w-4" />
                <span>Send a Direct Message</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">How Can We Help You?</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Fill out the form below and a representative will respond shortly.
              </p>

              {submitted ? (
                <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Thank You for Reaching Out!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Your message has been successfully logged. Our legal support coordinator will
                    review your inquiry and get back to you at{" "}
                    <span className="font-semibold text-foreground">
                      {formData.email || "your email"}
                    </span>
                    .
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        category: "general",
                        subject: "",
                        message: "",
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <span>Send Another Message</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Your Full Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Inquiry Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      >
                        <option value="general">General Platform Inquiry</option>
                        <option value="citizen">Citizen Case Filing Support</option>
                        <option value="lawyer">Lawyer Verification & Onboarding</option>
                        <option value="technical">Technical Bug / Issue</option>
                        <option value="partnership">Legal Partnership / Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Subject <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Brief summary of your inquiry"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Message <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Please provide details about your request or inquiry..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      We respect your privacy. Information is confidential.
                    </p>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
                    >
                      <span>Send Message</span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
