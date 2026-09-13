import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Scale, Search } from "lucide-react";
import { api, fmtDate, daysLeft } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Card, Button, StatusBadge, Badge, Spinner, Empty, Modal, Field, inputCls, PageHead } from "../components/ui.jsx";

const categories = ["Weighing", "Length", "Volume", "Area", "Pressure", "Temperature", "Power", "Other"];

export function Instruments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Weighing", make: "", model: "", serialNo: "", capacity: "", leastCount: "", accuracyClass: "", stampingYear: "", location: "", state: "", district: "" });

  const load = () => api.get(`/instruments${q ? `?q=${encodeURIComponent(q)}` : ""}`).then(setItems);
  useEffect(() => { load(); }, [q]);
  useEffect(() => { if (!open) setForm({ name: "", category: "Weighing", make: "", model: "", serialNo: "", capacity: "", leastCount: "", accuracyClass: "", stampingYear: "", location: "", state: "", district: "" }); }, [open]);

  const save = async (e) => {
    e.preventDefault();
    setSaveBusy(true);
    try {
      await api.post("/instruments", { ...form, stampingYear: form.stampingYear ? Number(form.stampingYear) : undefined });
      setOpen(false);
      load();
    } catch (err) { alert(err.message); }
    finally { setSaveBusy(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const lastVerified = (item) => item.verifications?.[0];

  if (!items) return <Spinner />;

  return (
    <>
      <PageHead
        title="Instruments"
        subtitle="Registry of weighing & measuring instruments"
        actions={user.role === "BUSINESS" || user.role === "ADMIN" ? (
          <Button onClick={() => setOpen(true)}><Plus size={16} /> Register Instrument</Button>
        ) : undefined}
      />
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9`} placeholder="Search by name, serial no or make..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {items.length === 0 ? (
        <Card><Empty icon={Scale} title="No instruments found" message="Register your first weighing or measuring instrument." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const v = lastVerified(it);
            const expired = v?.certificate && daysLeft(v.certificate.validUntil) < 0;
            return (
              <Link key={it.id} to={`/app/instruments/${it.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-50 p-2 text-brand-700"><Scale size={20} /></div>
                    <div>
                      <p className="font-semibold text-slate-900">{it.name}</p>
                      <p className="text-xs text-slate-500">{it.category} · {it.serialNo}</p>
                    </div>
                  </div>
                  <StatusBadge status={it.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p><span className="font-medium text-slate-900">{it.make || "—"}</span> {it.model}</p>
                  <p>Capacity: <span className="font-medium">{it.capacity || "—"}</span></p>
                </div>
                {v?.certificate ? (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Certificate {v.result === "PASS" ? "valid till" : "result"}</span>
                      <Badge tone={expired ? "red" : v.result === "PASS" ? "green" : "red"}>{expired ? "expired" : fmtDate(v.certificate.validUntil)}</Badge>
                    </div>
                    <Link to={`/app/certificates/${v.certificate.id}`} className="mt-1 inline-block text-brand-700 hover:underline">{v.certificate.certificateNo}</Link>
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Not yet verified</p>
                )}
                <p className="mt-2 text-xs text-slate-400">{it.owner?.orgName || it.owner?.name}</p>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Register instrument">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instrument name" required><input className={inputCls} required value={form.name} onChange={set("name")} placeholder="e.g. Electronic Weighing Scale" /></Field>
            <Field label="Category" required><select className={inputCls} value={form.category} onChange={set("category")}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Make" required><input className={inputCls} value={form.make} onChange={set("make")} /></Field>
            <Field label="Model"><input className={inputCls} value={form.model} onChange={set("model")} /></Field>
            <Field label="Serial number" required><input className={inputCls} required value={form.serialNo} onChange={set("serialNo")} /></Field>
            <Field label="Capacity"><input className={inputCls} value={form.capacity} onChange={set("capacity")} placeholder="e.g. 300 kg" /></Field>
            <Field label="Least count"><input className={inputCls} value={form.leastCount} onChange={set("leastCount")} /></Field>
            <Field label="Accuracy class"><input className={inputCls} value={form.accuracyClass} onChange={set("accuracyClass")} /></Field>
            <Field label="Stamping year"><input className={inputCls} type="number" value={form.stampingYear} onChange={set("stampingYear")} /></Field>
            <Field label="Location"><input className={inputCls} value={form.location} onChange={set("location")} /></Field>
            <Field label="State"><input className={inputCls} value={form.state} onChange={set("state")} /></Field>
            <Field label="District"><input className={inputCls} value={form.district} onChange={set("district")} /></Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saveBusy}>{saveBusy ? "Saving..." : "Register"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}