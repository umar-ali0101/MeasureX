import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, ShieldCheck } from "lucide-react";
import { api, fmtDate, daysLeft } from "../api.js";
import { Card, Spinner, Badge, PageHead } from "../components/ui.jsx";

export function CertificateView() {
  const { id } = useParams();
  const [c, setC] = useState(null);

  useEffect(() => { api.get(`/certificates/${id}`).then(setC); }, [id]);
  if (!c) return <Spinner />;

  const v = c.verification;
  const d = daysLeft(c.validUntil);
  const status = c.status === "REVOKED" ? "REVOKED" : d < 0 ? "EXPIRED" : "VALID";
  const tone = status === "VALID" ? "green" : "red";

  return (
    <>
      <PageHead
        title="Digital Verification Certificate"
        subtitle="Printed and legible for export & display"
        actions={<button onClick={() => window.print()} className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"><Printer size={16} /> Print / Save PDF</button>}
      />

      <div className="print-area mx-auto max-w-3xl overflow-hidden rounded-xl border-2 border-double border-brand-700 bg-white shadow-lg">
        <div className="bg-brand-800 px-8 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-lg font-bold text-brand-800">LM</div>
              <div>
                <p className="text-lg font-bold">VERIFICATION CERTIFICATE</p>
                <p className="text-xs text-brand-100">Legal Metrology Act, 2009 · Legal Metrology (General) Rules, 2011</p>
              </div>
            </div>
            <Badge tone={tone} className="capitalize">{status}</Badge>
          </div>
        </div>

        <div className="px-8 py-6 md:flex md:items-start md:justify-between md:gap-8">
          <div className="flex-1">
            <p className="font-mono text-sm text-brand-700"><span className="text-slate-400">Certificate No:</span> {c.certificateNo}</p>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <h2 className="text-xl font-bold text-slate-900">{v.instrument?.name}</h2>
              <p className="text-sm text-slate-500">{v.instrument?.category} · Serial No: {v.instrument?.serialNo}</p>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between border-b border-slate-100 pb-1"><dt className="text-slate-500">Make / Model</dt><dd className="font-medium text-slate-800">{v.instrument?.make} {v.instrument?.model}</dd></div>
                <div className="flex justify-between border-b border-slate-100 pb-1"><dt className="text-slate-500">Capacity</dt><dd className="font-medium text-slate-800">{v.instrument?.capacity || "—"}</dd></div>
                <div className="flex justify-between border-b border-slate-100 pb-1"><dt className="text-slate-500">Least count</dt><dd className="font-medium text-slate-800">{v.instrument?.leastCount || "—"}</dd></div>
                <div className="flex justify-between border-b border-slate-100 pb-1"><dt className="text-slate-500">Location</dt><dd className="font-medium text-slate-800">{v.instrument?.location || "—"}</dd></div>
              </dl>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 px-2 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Valid from</dt>
                <dd className="text-sm font-semibold text-slate-800">{fmtDate(c.validFrom)}</dd>
              </div>
              <div className="rounded-lg bg-brand-50 px-2 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-brand-600">Valid until</dt>
                <dd className="text-sm font-semibold text-brand-800">{fmtDate(c.validUntil)}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-2 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Verified</dt>
                <dd className="text-sm font-semibold text-slate-800">{fmtDate(v.verifiedAt)}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-medium text-slate-800">Verifying Officer:</span> {v.officer?.name} ({v.officer?.role})
              <p className="mt-1 text-xs text-slate-500">{v.officer?.email}</p>
            </div>

            {v.observations && <p className="mt-3 text-sm text-slate-600"><span className="font-medium">Observations:</span> {v.observations}</p>}

            <div className="mt-5 border-t border-slate-200 pt-3 flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-600" />
              <p>Tamper-evident digital signature hash: <code className="break-all text-slate-500">{c.verificationHash}</code></p>
            </div>
          </div>

          <div className="mt-6 shrink-0 text-center md:mt-0 md:ml-8">
            <img src={c.qrData} alt="QR verification code" className="mx-auto h-40 w-40 rounded-xl border-2 border-slate-200" />
            <p className="mt-2 max-w-[160px] text-[10px] leading-tight text-slate-500">Scan to verify authenticity on the public portal</p>
            <p className="mt-1 font-mono text-[10px] text-slate-400">{c.certificateNo}</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Validate this certificate online at any time — copy the certificate number into the {' '}
        <Link to="/verify-certificate" className="text-brand-700 underline">public verification portal</Link>.
      </p>
    </>
  );
}