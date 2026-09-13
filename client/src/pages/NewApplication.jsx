import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Card, Button, Field, inputCls, PageHead } from "../components/ui.jsx";

export function NewApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preselect = location.state?.instrumentId;

  const [instruments, setInstruments] = useState([]);
  const [form, setForm] = useState({ instrumentId: preselect || "", type: "REVERIFICATION", preferredDate: "", remarks: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/instruments").then((list) => {
      setInstruments(list);
      if (list.length && !preselect) setForm((f) => ({ ...f, instrumentId: list[0].id }));
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.instrumentId) return setError("Select an instrument first.");
    setError("");
    setBusy(true);
    try {
      const data = await api.post("/applications", {
        instrumentId: form.instrumentId,
        type: form.type,
        preferredDate: form.preferredDate || undefined,
        remarks: form.remarks || undefined,
      });
      navigate(`/app/applications/${data.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const selected = instruments.find((i) => i.id === form.instrumentId);

  return (
    <>
      <PageHead title="New Verification Application" subtitle="Submit for verification or re-verification of an instrument" />
      <Card className="max-w-2xl p-6">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Instrument" required hint={selected ? `${selected.name} · ${selected.serialNo} · status: ${selected.status}` : undefined}>
            <select className={inputCls} value={form.instrumentId} onChange={(e) => setForm({ ...form, instrumentId: e.target.value })}>
              <option value="">Select instrument</option>
              {instruments.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.serialNo})</option>)}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Application type" required>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="NEW">New verification</option>
                <option value="REVERIFICATION">Re-verification</option>
              </select>
            </Field>
            <Field label="Preferred date">
              <input className={inputCls} type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Remarks / details">
            <textarea className={inputCls} rows={3} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Any additional details for the officer..." />
          </Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="border-t border-slate-200 pt-4 text-sm text-slate-500">
            <p>Applicant: <span className="font-medium text-slate-800">{user.orgName || user.name}</span></p>
            <p className="mt-1">Fees are assessed after scheduling by the verifying authority.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit Application"}</Button>
          </div>
        </form>
      </Card>
    </>
  );
}