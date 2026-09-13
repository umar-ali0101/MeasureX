import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Scale, FileText, BadgeCheck, UserCheck, Shield } from "lucide-react";
import { Card, Button, Spinner, Badge, StatusBadge, Empty, PageHead, inputCls } from "../components/ui.jsx";
import { fmtDate, fmtDateTime } from "../api.js";

export function SearchPage() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [searched, setSearched] = useState(false);

  const run = async (e) => {
    e.preventDefault();
    if (q.length < 2) return;
    setBusy(true);
    setSearched(true);
    try {
      const data = await apiGet(q);
      setRes(data);
    } catch (err) {
      setRes(null);
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const apiGet = async (term) => {
    const token = localStorage.getItem("lm_token");
    const r = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error((await r.json()).error || "Search failed");
    return r.json();
  };

  return (
    <>
      <PageHead title="Search & Retrieval" subtitle="Central search across instruments, applications and certificates" />
      <Card className="max-w-2xl p-5">
        <form onSubmit={run} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} pl-9`} placeholder="Serial no / certificate no / application no / name..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy}>{busy ? "Searching..." : "Search"}</Button>
        </form>
      </Card>

      {busy && <Spinner label="Searching records..." />}

      {!busy && searched && res && (
        <div className="mt-5 space-y-6">
          <section>
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><Scale size={16} /> Instruments ({res.instruments?.length || 0})</h3>
            {res.instruments?.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {res.instruments.map((i) => (
                  <Link key={i.id} to={`/app/instruments/${i.id}`} className="rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50">
                    <div className="flex justify-between"><span className="font-medium text-slate-800">{i.name}</span><StatusBadge status={i.status} /></div>
                    <p className="text-xs text-slate-500">{i.serialNo} · {i.category} · {i.owner?.orgName || i.owner?.name}</p>
                  </Link>
                ))}
              </div>
            ) : <Empty icon={Scale} title="No instruments matched" />}
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><FileText size={16} /> Applications ({res.applications?.length || 0})</h3>
            {res.applications?.length ? (
              <div className="space-y-2">
                {res.applications.map((a) => (
                  <Link key={a.id} to={`/app/applications/${a.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50">
                    <div>
                      <p className="font-medium text-brand-700">{a.applicationNo}</p>
                      <p className="text-xs text-slate-500">{a.instrument?.name} · {a.applicant?.orgName || a.applicant?.name}</p>
                    </div>
                    <div className="flex items-center gap-2"><Badge tone={a.type === "NEW" ? "blue" : "purple"}>{a.type}</Badge><StatusBadge status={a.status} /></div>
                  </Link>
                ))}
              </div>
            ) : <Empty icon={FileText} title="No applications matched" />}
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><BadgeCheck size={16} /> Certificates ({res.certificates?.length || 0})</h3>
            {res.certificates?.length ? (
              <div className="space-y-2">
                {res.certificates.map((c) => (
                  <Link key={c.id} to={`/app/certificates/${c.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <img src={c.qrData} alt="" className="h-9 w-9 rounded border border-slate-200" />
                      <div>
                        <p className="font-mono text-sm font-medium text-brand-700">{c.certificateNo}</p>
                        <p className="text-xs text-slate-500">{c.verification?.instrument?.name} · {c.verification?.instrument?.serialNo} · valid till {fmtDate(c.validUntil)}</p>
                      </div>
                    </div>
                    <Badge tone="green">VALID</Badge>
                  </Link>
                ))}
              </div>
            ) : <Empty icon={BadgeCheck} title="No certificates matched" />}
          </section>
        </div>
      )}

      {!busy && searched && !res && <Card className="mt-5"><Empty icon={Search} title="Nothing found" message="Try a serial number, certificate number or application number." /></Card>}
    </>
  );
}