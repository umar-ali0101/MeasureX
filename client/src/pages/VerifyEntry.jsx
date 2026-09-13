import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, Scale } from "lucide-react";
import { api, fmtDate } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Card, Button, Field, inputCls, Spinner, Badge, PageHead, Modal, StatusBadge } from "../components/ui.jsx";

export function VerifyEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const applicationId = search.get("applicationId");
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ observations: "", validityYears: "1", nextDueDate: "" });

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }
    api.get(`/applications/${applicationId}`)
      .then((a) => { setApp(a); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [applicationId]);

  const submit = async (result) => {
    setBusy(true);
    setError("");
    try {
      const data = await api.post("/verifications", {
        applicationId,
        result,
        observations: form.observations || undefined,
        validityYears: Number(form.validityYears) || 1,
        nextDueDate: form.nextDueDate || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading application..." />;

  if (result) {
    return (
      <>
        <PageHead title="Verification recorded" subtitle="Certificate issued" />
        <Card className="max-w-2xl p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <BadgeCheck size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {result.verification?.result === "PASS" ? "Verification passed!" : "Verification failed"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {result.certificate
              ? `Certificate ${result.certificate.certificateNo} has been issued and is valid from ${fmtDate(result.certificate.validFrom)} to ${fmtDate(result.certificate.validUntil)}.`
              : "No certificate issued for this instrument."}
          </p>
          {result.certificate && (
            <div className="mt-4 inline-block">
              <img src={result.certificate.qrData} alt="QR verification code" className="mx-auto h-40 w-40 rounded-xl border border-slate-200" />
              <p className="mt-2 text-xs text-slate-500">QR code links to certificate verification portal</p>
            </div>
          )}
          <div className="mt-6 flex justify-center gap-2">
            {result.certificate && (
              <Button onClick={() => navigate(`/app/certificates/${result.certificate.id}`)}>View certificate</Button>
            )}
            <Button variant="secondary" onClick={() => navigate("/app/applications")}>Back to applications</Button>
          </div>
        </Card>
      </>
    );
  }

  if (!applicationId) {
    return (
      <>
        <PageHead title="Field Verification" subtitle="Select an application to begin verification" />
        <Card className="p-6">
          <p className="text-sm text-slate-600">
            Go to an application with status <Badge tone="purple">SCHEDULED</Badge> or <Badge tone="amber">IN_PROGRESS</Badge> and click "Record Verification & Issue Certificate".
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHead
        title={<span className="inline-flex items-center gap-2">Field verification</span>}
        subtitle={app ? `${app.applicationNo} · ${app.instrument?.name} · ${app.instrument?.serialNo}` : "Verifying instrument"}
      />
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900 flex items-center gap-2"><Scale size={18} /> Instrument details</h3>
          {app && (
            <dl className="space-y-2">
              {[["Name", app.instrument?.name], ["Serial number", app.instrument?.serialNo], ["Category", app.instrument?.category], ["Make / Model", `${app.instrument?.make || "—"} ${app.instrument?.model || ""}`], ["Capacity", app.instrument?.capacity], ["Least count", app.instrument?.leastCount], ["Owner", app.applicant?.orgName || app.applicant?.name]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-100 pb-2 text-sm">
                  <span className="font-medium text-slate-500">{k}</span>
                  <span className="text-slate-800">{v || "—"}</span>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Record verification result</h3>
          <p className="mb-4 text-sm text-slate-500">Conduct the physical inspection and enter your observations and result below.</p>
          <div className="space-y-4">
            <Field label="Observations" required hint="Physical inspection details, load test results, seal condition, etc.">
              <textarea
                className={inputCls}
                rows={5}
                required
                value={form.observations}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
                placeholder="Record detailed inspection observations: load test passed, calibration check OK, seals intact, etc."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Validity period (years)" hint="1–10 years, default 1">
                <select className={inputCls} value={form.validityYears} onChange={(e) => setForm({ ...form, validityYears: e.target.value })}>
                  {[1, 2, 3, 5, 10].map((y) => <option key={y} value={y}>{y} year{y > 1 ? "s" : ""}</option>)}
                </select>
              </Field>
              <Field label="Next due date" hint="Override calculated due date if required">
                <input className={inputCls} type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} />
              </Field>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="mb-3 text-sm font-medium text-slate-700">Issue verification result & certificate:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="success"
                  disabled={busy}
                  onClick={() => submit("PASS")}
                >
                  <BadgeCheck size={16} /> {busy ? "Processing..." : "PASS – Issue certificate"}
                </Button>
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => submit("FAIL")}
                >
                  {busy ? "Processing..." : "FAIL – Reject"}
                </Button>
                <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}