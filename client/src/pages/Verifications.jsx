import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Search } from "lucide-react";
import { api, fmtDate } from "../api.js";
import { Card, Badge, Spinner, Empty, StatusBadge, PageHead } from "../components/ui.jsx";

export function Verifications() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => { api.get("/verifications").then(setItems); }, []);
  if (!items) return <Spinner />;

  const filtered = q ? items.filter((v) => [v.instrument?.name, v.instrument?.serialNo, v.application?.applicationNo].some((x) => x?.toLowerCase().includes(q.toLowerCase()))) : items;

  return (
    <>
      <PageHead title="Verification Records" subtitle="History of all verification activities" />
      <div className="mb-4">
        <input className="max-w-sm w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" placeholder="Search verification records..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <Card><Empty icon={BadgeCheck} title="No verifications found" /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Link key={v.id} to={`/app/verifications/${v.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{v.instrument?.name}</p>
                  <p className="text-xs text-slate-500">{v.instrument?.serialNo}</p>
                </div>
                <Badge tone={v.result === "PASS" ? "green" : "red"}>{v.result}</Badge>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                <p>Officer: {v.officer?.name} ({v.officer?.role})</p>
                <p>Verified: {fmtDate(v.verifiedAt)}</p>
                <p>{v.application?.applicationNo}</p>
              </div>
              {v.certificate && (
                <p className="mt-2 text-sm font-medium text-brand-700">Certificate: {v.certificate.certificateNo}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}