import { Link } from "react-router-dom";
import { Scale, FileText, BadgeCheck, Bell, ShieldCheck, Smartphone, Search, ArrowRight, Building2 } from "lucide-react";
import { useAuth } from "../auth.jsx";

const features = [
  { icon: FileText, title: "Online Applications", desc: "Submit verification & re-verification applications for weighing and measuring instruments in minutes." },
  { icon: Scale, title: "Verification Workflow", desc: "End-to-end scheduling and allocation to Legal Metrology Officers and Approved Test Centres." },
  { icon: BadgeCheck, title: "Digital Certificates", desc: "Tamper-evident certificates with secure QR codes, verifiable by anyone, anywhere." },
  { icon: Bell, title: "Expiry Alerts", desc: "Automated reminders when verification validity approaches so compliance never lapses." },
  { icon: ShieldCheck, title: "Role-based Security", desc: "Secure login for businesses, LMOs, GATCs and administrators with audit trails." },
  { icon: Search, title: "Central Records", desc: "National-style registry with instant search across instruments, applications & certificates." },
];

const stakeholders = [
  { icon: Building2, role: "Business / User", desc: "Register instruments, apply for verification, download QR certificates, track validity." },
  { icon: BadgeCheck, role: "Legal Metrology Officer", desc: "Receive assignments, conduct field verification, record results and issue certificates." },
  { icon: Smartphone, role: "Approved Test Centre", desc: "Manage your verification queue, complete inspections and process digital certification." },
  { icon: ShieldCheck, role: "Administrator", desc: "Monitor pendency, enforcement status, users and system analytics on one dashboard." },
];

export function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-brand-50/40">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">LM</div>
            <div>
              <p className="font-semibold text-slate-900">LM Verify</p>
              <p className="text-[11px] text-slate-500">Legal Metrology Digital Certification</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link to="/app" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Sign in</Link>
                <Link to="/register" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
          Under Legal Metrology Act, 2009 & Rules, 2011
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Unified Verification & Digital Certification for Compliance
          <span className="text-brand-700"> Weighing & Measuring Instruments</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
          A secure online platform connecting businesses, Legal Metrology Officers, Approved Test Centres
          and regulators — for online applications, scheduling, digital verification records and
          QR-enabled certificates.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to={user ? "/app" : "/register"} className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-800">
            {user ? "Open Dashboard" : "Register Now"} <ArrowRight size={18} />
          </Link>
          <Link to="/verify-certificate" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <BadgeCheck size={18} /> Verify a Certificate
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold text-slate-900">Built for every stakeholder</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stakeholders.map((s) => (
              <div key={s.role} className="rounded-xl border border-slate-200 p-5">
                <div className="mb-2 flex items-center gap-2 text-brand-700">
                  <s.icon size={20} />
                  <h3 className="font-semibold">{s.role}</h3>
                </div>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        LM Verify · Smart India Hackathon 2026 Prototype · Demo credentials: admin@lm.gov.in / admin123
      </footer>
    </div>
  );
}