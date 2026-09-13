import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { api, fmtDate, fmtDateTime } from "../api.js";
import { Card, Spinner, Badge, Button, Empty } from "../components/ui.jsx";

export function VerificationDetail() {
  const { id } = useParams();
  const [v, setV] = useState(null);

  useEffect(() => { api.get(`/verifications/${id}`).then(setV); }, [id]);
  if (!v) return <Spinner />;

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <Link to="/app/verifications" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={16} /> Back</Link>
        {v.certificate && <Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print</Button>}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900">{v.instrument?.name}</h1>
            <Badge tone={v.result === "PASS" ? "green" : "red"}>{v.result}</Badge>
          </div>
          <p className="text-sm text-slate-500">{v.instrument?.serialNo} · {v.instrument?.category}</p>
          <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[["Application", v.application?.applicationNo], ["Verified by", `${v.officer?.name} (${v.officer?.role})`], ["Verified at", fmtDateTime(v.verifiedAt)], ["Certificate status", v.certificate?.status]].map(([k, val]) => (
              <div key={k} className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="text-sm text-slate-800">{val || "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-slate-600"><span className="font-medium">Observations:</span> {v.observations || "—"}</p>
        </Card>
        {v.certificate ? (
          <Card className="p-5 text-center">
            <h3 className="mb-2 font-semibold text-slate-900">Digital certificate</h3>
            <img src={v.certificate.qrData} alt="QR" className="mx-auto mb-3 h-36 w-36 rounded-xl border border-slate-200" />
            <p className="font-mono text-sm text-brand-700">{v.certificate.certificateNo}</p>
            <p className="mt-1 text-xs text-slate-500">Valid {fmtDate(v.certificate.validFrom)} → {fmtDate(v.certificate.validUntil)}</p>
            <Link to={`/app/certificates/${v.certificate.id}`} className="mt-3 block rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800">View full certificate</Link>
          </Card>
        ) : (
          <Card className="p-5"><Empty icon={Printer} title="No certificate" message="Certificate was not issued (instrument failed verification or was rejected)." /></Card>
        )}
      </div>
    </>
  );
}