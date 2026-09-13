import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, FileText, BadgeCheck, Download, Trash2 } from "lucide-react";
import { api, fmtDate } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Card, Spinner, StatusBadge, Badge, Button, Empty, Modal, Field, inputCls, PageHead } from "../components/ui.jsx";

export function InstrumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get(`/instruments/${id}`).then((d) => { setItem(d); setForm(d); });
  }, [id]);

  if (!item) return <Spinner />;
  const canEdit = user.role === "ADMIN" || item.ownerId === user.id;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await api.put(`/instruments/${item.id}`, form);
      setItem(updated);
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const remove = async () => {
    if (!confirm("Delete this instrument? This cannot be undone.")) return;
    try { await api.del(`/instruments/${item.id}`); navigate("/app/instruments"); }
    catch (err) { alert(err.message); }
  };

  const latestCert = item.verifications?.[0]?.certificate;

  return (
    <>
      <PageHead
        title={<Link to="/app/instruments" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600"><ArrowLeft size={18} /></Link>}
        subtitle={item.serialNo}
        actions={
          <>
            {latestCert && <Button variant="secondary" onClick={() => navigate(`/app/certificates/${latestCert.id}`)}><BadgeCheck size={16} /> View Certificate</Button>}
            {canEdit && <Button onClick={() => setOpen(true)}>Edit</Button>}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-50 p-3 text-brand-700"><Scale size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{item.name}</h1>
              <div className="mt-1 flex items-center gap-2"><StatusBadge status={item.status} /><Badge tone="blue">{item.category}</Badge></div>
            </div>
          </div>
          <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {[["Make", item.make], ["Model", item.model], ["Serial number", item.serialNo], ["Capacity", item.capacity], ["Least count", item.leastCount], ["Accuracy class", item.accuracyClass], ["Stamping year", item.stampingYear], ["Location", item.location], ["State", item.state], ["District", item.district]].map(([k, v]) => (
              <div key={k} className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="text-sm text-slate-800">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Owner</h3>
          <p className="font-medium text-slate-800">{item.owner?.orgName || item.owner?.name}</p>
          <p className="text-sm text-slate-500">{item.owner?.email}</p>
          <p className="text-sm text-slate-500">{item.owner?.phone}</p>
          <h3 className="mb-2 mt-6 font-semibold text-slate-900">Quick actions</h3>
          <div className="space-y-2">
            {user.role === "BUSINESS" && (
              <Button className="w-full justify-center" onClick={() => navigate("/app/applications/new", { state: { instrumentId: item.id } })}><FileText size={16} /> Apply for Verification</Button>
            )}
            {latestCert && (
              <><Button variant="secondary" className="w-full justify-center" onClick={() => window.print()}><Download size={16} /> Print / Export</Button>
              <p className="text-center text-xs text-slate-400">QR-enabled digital certificate</p></>
            )}
            {canEdit && <Button variant="danger" className="w-full justify-center" onClick={remove}><Trash2 size={16} /> Delete</Button>}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Verification history</h3>
          {item.verifications?.length ? (
            <div className="space-y-2">
              {item.verifications.map((v) => (
                <div key={v.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{fmtDate(v.verifiedAt)} · {v.officer.name}</span>
                    <Badge tone={v.result === "PASS" ? "green" : "red"}>{v.result}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{v.observations}</p>
                  {v.certificate && (
                    <Link to={`/app/certificates/${v.certificate.id}`} className="mt-1 inline-block text-xs font-medium text-brand-700 hover:underline">{v.certificate.certificateNo} · valid till {fmtDate(v.certificate.validUntil)}</Link>
                  )}
                </div>
              ))}
            </div>
          ) : <Empty icon={Scale} title="No verifications yet" message="Apply for verification to get this instrument certified." />}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Applications</h3>
          {item.applications?.length ? (
            <div className="space-y-2">
              {item.applications.map((a) => (
                <Link key={a.id} to={`/app/applications/${a.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.applicationNo}</p>
                    <p className="text-xs text-slate-500">{a.type} · {fmtDate(a.createdAt)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          ) : <Empty icon={FileText} title="No applications" />}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit instrument">
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className={inputCls} value={form.name || ""} onChange={set("name")} /></Field>
          <Field label="Make"><input className={inputCls} value={form.make || ""} onChange={set("make")} /></Field>
          <Field label="Model"><input className={inputCls} value={form.model || ""} onChange={set("model")} /></Field>
          <Field label="Capacity"><input className={inputCls} value={form.capacity || ""} onChange={set("capacity")} /></Field>
          <Field label="Least count"><input className={inputCls} value={form.leastCount || ""} onChange={set("leastCount")} /></Field>
          <Field label="Location"><input className={inputCls} value={form.location || ""} onChange={set("location")} /></Field>
          <div className="col-span-full flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}