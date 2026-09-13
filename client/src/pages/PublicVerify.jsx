import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Search as SearchIcon, BadgeCheck, XCircle } from "lucide-react";
import { Card, Button, inputCls, Badge } from "../components/ui.jsx";
import { fmtDate } from "../api.js";

export function PublicVerify() {
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const check = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Certificate not found");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-brand-50/40">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white">LM</div>
            <span className="font-semibold text-slate-900">LM Verify</span>
          </Link>
          <Link to="/login" className="text-sm font-medium text-brand-700 hover:underline">Stakeholder login</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><ShieldCheck size={28} /></div>
          <h1 className="text-2xl font-bold text-slate-900">Verify a Certificate</h1>
          <p className="mt-2 text-slate-600">Enter the certificate number printed on the digital certificate or scan its QR code to confirm authenticity.</p>
        </div>

        <Card className="mx-auto mt-6 max-w-xl p-5">
          <form onSubmit={check} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${inputCls} pl-9`} placeholder="e.g. LM-CERT-2026-384912" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy}>{busy ? "Checking..." : "Verify"}</Button>
          </form>
          <p className="mt-2 text-center text-xs text-slate-400">QR code links share your camera to get here automatically on mobile.</p>
        </Card>

        {error && (
          <Card className="mx-auto mt-6 max-w-xl border-red-200 p-5">
            <div className="flex items-center gap-3 text-red-700">
              <XCircle size={24} />
              <div>
                <p className="font-semibold">Verification failed / not found</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {data && (
          <Card className="mx-auto mt-6 max-w-xl overflow-hidden">
            <div className={`px-5 py-3 ${data.status === "VALID" ? "bg-emerald-50" : data.status === "EXPIRED" ? "bg-amber-50" : "bg-red-50"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={20} className={data.status === "VALID" ? "text-emerald-600" : "text-red-500"} />
                  <p className="font-bold text-slate-900">STATUS: {data.status}</p>
                </div>
                <Badge tone={data.status === "VALID" ? "green" : data.status === "EXPIRED" ? "amber" : "red"}>{data.status}</Badge>
              </div>
            </div>
            <div className="p-5">
              <p className="font-mono text-sm text-brand-700">{data.certificateNo}</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">{data.instrument?.name}</h2>
              <p className="text-sm text-slate-500">{data.instrument?.serialNo} · {data.instrument?.category}</p>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between border-b border-slate-100 pb-1"><dt className="text-slate-500">Owner</dt><dd className="font-medium">{data.instrument?.owner?.orgName || data.instrument?.owner?.name}</dd></div>
                <div className="flex justify-between border-b border-slate-100 pb-1"><dt className="text-slate-500">Verified by</dt><dd className="font-medium">{data.officer?.name} ({data.officer?.role})</dd></div>
                <div className="flex justify-between border-b border-slate-100 pb-1"><dt className="text-slate-500">Valid from</dt><dd className="font-medium">{fmtDate(data.validFrom)}</dd></div>
                <div className="flex justify-between border-b border-slate-100 pb-1"><dt className="text-slate-500">Valid until</dt><dd className="font-medium">{fmtDate(data.validUntil)}</dd></div>
              </dl>
              <p className="mt-4 rounded-lg bg-slate-50 p-3 font-mono text-[11px] break-all text-slate-500">Digital hash: {data.hash}</p>
              <p className="mt-3 text-xs text-slate-400">Certificate verified against the official Legal Metrology digital registry.</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}