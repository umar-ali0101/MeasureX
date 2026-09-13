import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { api, fmtDate, fmtMoney } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Card, Button, StatusBadge, Badge, Spinner, Empty, PageHead, inputCls } from "../components/ui.jsx";

const FILTERS = ["", "SUBMITTED", "SCHEDULED", "IN_PROGRESS", "VERIFIED", "REJECTED", "CANCELLED"];

export function Applications() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get(`/applications${status ? `?status=${status}` : ""}`).then(setItems);
  }, [status]);

  if (!items) return <Spinner />;
  const filtered = q
    ? items.filter((a) =>
        [a.applicationNo, a.instrument?.name, a.instrument?.serialNo, a.applicant?.orgName || a.applicant?.name]
          .some((v) => v?.toLowerCase().includes(q.toLowerCase())),
      )
    : items;

  return (
    <>
      <PageHead
        title="Applications"
        subtitle={user.role === "BUSINESS" ? "Verification & re-verification applications" : "All verification applications"}
        actions={user.role === "BUSINESS" || user.role === "ADMIN" ? <Link to="/app/applications/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"><Plus size={16} /> New Application</Link> : undefined}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="Search application/ instrument..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setStatus(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${status === f ? "bg-brand-700 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
              {f || "ALL"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><Empty icon={FileText} title="No applications found" message="Applications you create or get assigned will appear here." /></Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Application No</th>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/app/applications/${a.id}`} className="font-medium text-brand-700 hover:underline">{a.applicationNo}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{a.instrument?.name}</p>
                    <p className="text-xs text-slate-500">{a.instrument?.serialNo}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.applicant?.orgName || a.applicant?.name}</td>
                  <td className="px-4 py-3"><Badge tone={a.type === "NEW" ? "blue" : "purple"}>{a.type}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{a.assignedTo ? `${a.assignedTo.name} (${a.assignedTo.role})` : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.feeAmount ? fmtMoney(a.feeAmount) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.scheduledDate ? fmtDate(a.scheduledDate) : fmtDate(a.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}