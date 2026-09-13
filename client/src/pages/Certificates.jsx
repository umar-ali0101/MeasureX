import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Search } from "lucide-react";
import { api, fmtDate, daysLeft } from "../api.js";
import { Card, Badge, Spinner, Empty, PageHead, inputCls } from "../components/ui.jsx";

export function Certificates() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => { api.get("/certificates").then((list) => setItems(list)); }, []);
  if (!items) return <Spinner />;

  const filtered = q ? items.filter((c) => [c.certificateNo, c.verification?.instrument?.name, c.verification?.instrument?.serialNo].some((x) => x?.toLowerCase().includes(q.toLowerCase()))) : items;

  return (
    <>
      <PageHead title="Digital Certificates" subtitle="QR-enabled verification certificates" />
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9`} placeholder="Search by certificate no or serial..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {filtered.length === 0 ? (
        <Card><Empty icon={BadgeCheck} title="No certificates" message="Certificates issued against completed verifications appear here." /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const d = daysLeft(c.validUntil);
            const status = c.status === "REVOKED" ? "REVOKED" : d < 0 ? "EXPIRED" : "VALID";
            return (
              <Link key={c.id} to={`/app/certificates/${c.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img src={c.qrData} alt="" className="h-12 w-12 rounded border border-slate-200" />
                    <div>
                      <p className="font-mono text-xs font-semibold text-brand-700">{c.certificateNo}</p>
                      <p className="text-sm font-medium text-slate-800">{c.verification?.instrument?.name}</p>
                      <p className="text-xs text-slate-500">{c.verification?.instrument?.serialNo}</p>
                    </div>
                  </div>
                  <Badge tone={status === "VALID" && d > 30 ? "green" : status === "VALID" ? "amber" : "red"}>{status === "VALID" ? `${d} days left` : status}</Badge>
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <span>Issued {fmtDate(c.issuedAt)}</span>
                  <span>Valid till <span className="font-medium text-slate-700">{fmtDate(c.validUntil)}</span></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}