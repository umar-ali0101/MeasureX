import { X } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", size = "md", className = "", ...props }) {
  const variants = {
    primary: "bg-brand-700 hover:bg-brand-800 text-white shadow-sm",
    secondary: "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-sky-100 text-sky-800",
    purple: "bg-violet-100 text-violet-800",
    teal: "bg-teal-100 text-teal-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export const statusTone = (status = "") => {
  const map = {
    SUBMITTED: "blue", SCHEDULED: "purple", IN_PROGRESS: "amber", VERIFIED: "green",
    REJECTED: "red", CANCELLED: "slate", VALID: "green", EXPIRED: "red", REVOKED: "slate",
    ACTIVE: "green", SUSPENDED: "red", PENDING: "amber", REGISTERED: "blue", PAID: "green",
    PASS: "green", FAIL: "red",
  };
  return map[status] || "slate";
};

export function StatusBadge({ status }) {
  return <Badge tone={statusTone(status)}>{String(status).replace(/_/g, " ")}</Badge>;
}

export function Field({ label, children, required, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className={`mt-8 w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Empty({ icon: Icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      {Icon && <Icon className="text-slate-300" size={40} />}
      <p className="font-medium text-slate-600">{title}</p>
      {message && <p className="max-w-sm text-sm text-slate-400">{message}</p>}
    </div>
  );
}

export function PageHead({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}