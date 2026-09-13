import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, FileText, Upload, Paperclip, Calendar, UserCheck, X, Trash2 } from "lucide-react";
import { api, fmtDate, fmtMoney, fmtDateTime } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Card, Spinner, StatusBadge, Badge, Button, Modal, Field, inputCls, PageHead } from "../components/ui.jsx";

const STEPS = ["SUBMITTED", "SCHEDULED", "IN_PROGRESS", "VERIFIED"];

export function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [assignForm, setAssignForm] = useState({ assignedToId: "", assignedToType: "LMO", scheduledDate: "", feeAmount: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = { ref: null };

  const load = () => api.get(`/applications/${id}`).then(setApp);
  useEffect(() => { load(); }, [id]);

  if (!app) return <Spinner />;

  const isOwner = app.applicantId === user.id;
  const isAssigned = app.assignedToId === user.id;
  const isOfficer = ["LMO", "GATC"].includes(user.role);
  const canAssign = user.role === "ADMIN" || isOfficer;
  const currentStep = STEPS.indexOf(app.status) >= 0 ? STEPS.indexOf(app.status) : (app.status === "REJECTED" ? 3 : 0);

  const openAssign = () => {
    api.get("/users/available-assignees").then(({ assignees: a }) => setAssignees(a));
    setAssignForm({ assignedToId: "", assignedToType: user.role === "LMO" ? "LMO" : "GATC", scheduledDate: "", feeAmount: "" });
    setAssignOpen(true);
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/applications/${app.id}/assign`, {
        assignedToId: assignForm.assignedToId,
        assignedToType: assignForm.assignedToType,
        scheduledDate: assignForm.scheduledDate || undefined,
        feeAmount: assignForm.feeAmount ? Number(assignForm.feeAmount) : undefined,
      });
      setAssignOpen(false);
      load();
    } catch (err) { alert(err.message); } finally { setBusy(false); }
  };

  const transition = async (status) => {
    try { await api.patch(`/applications/${app.id}/status`, { status }); load(); }
    catch (err) { alert(err.message); }
  };

  const uploadFiles = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("applicationId", app.id);
      [...files].forEach((f) => fd.append("files", f));
      await api.upload("/documents", fd);
      load();
      e.target.value = "";
    } catch (err) { alert(err.message); } finally { setUploading(false); }
  };

  const download = async (docId) => {
    const token = localStorage.getItem("lm_token");
    window.open(`/api/documents/${docId}/download`, "_blank");
  };

  return (
    <>
      <PageHead
        title={
          <span className="inline-flex items-center gap-3">
            <Link to="/app/applications" className="text-slate-400 hover:text-slate-600"><ArrowLeft size={18} /></Link>
            {app.applicationNo}
          </span>
        }
        subtitle={`Submitted ${fmtDateTime(app.createdAt)}`}
        actions={<StatusBadge status={app.status} />}
      />

      <div className="mb-6 flex items-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${i <= currentStep ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-400"}`}>
              {i + 1}. {s.replace("_", " ")}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-slate-300" />}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Instrument</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{app.instrument?.name}</p>
                <p className="text-sm text-slate-500">{app.instrument?.serialNo} · {app.instrument?.category}</p>
                <p className="text-sm text-slate-500">{app.instrument?.make} {app.instrument?.model} · Capacity {app.instrument?.capacity || "—"}</p>
              </div>
              <Link to={`/app/instruments/${app.instrument?.id}`} className="text-sm font-medium text-brand-700 hover:underline">View instrument</Link>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Workflow</h3>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Type</dt>
                <dd className="text-sm text-slate-800"><Badge tone={app.type === "NEW" ? "blue" : "purple"}>{app.type}</Badge></dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Preferred date</dt>
                <dd className="text-sm text-slate-800">{app.preferredDate ? fmtDate(app.preferredDate) : "—"}</dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Scheduled date</dt>
                <dd className="text-sm text-slate-800">{app.scheduledDate ? fmtDate(app.scheduledDate) : "—"}</dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Verification fee</dt>
                <dd className="text-sm text-slate-800">{app.feeAmount ? fmtMoney(app.feeAmount) : "To be assessed"}</dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Payment status</dt>
                <dd className="text-sm text-slate-800"><Badge tone={app.paymentStatus === "PAID" ? "green" : "amber"}>{app.paymentStatus}</Badge></dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Assigned to</dt>
                <dd className="text-sm text-slate-800">{app.assignedTo ? `${app.assignedTo.name} (${app.assignedTo.role})` : "—"}</dd>
              </div>
            </dl>
            {app.remarks && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{app.remarks}</p>}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Documents & supporting attachments</h3>
            {(canAssign || isOwner || user.role === "ADMIN") && (
              <label className="mb-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Upload size={15} /> {uploading ? "Uploading..." : "Upload documents"}
                <input type="file" multiple hidden onChange={uploadFiles} disabled={uploading} />
              </label>
            )}
            {app.documents?.length ? (
              <ul className="space-y-2">
                {app.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip size={15} className="shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">{d.fileName}</p>
                        <p className="text-xs text-slate-400">{(d.size / 1024).toFixed(1)} KB · {d.uploader?.name}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => download(d.id)}>Download</Button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No attachments yet.</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-2 font-semibold text-slate-900">Applicant</h3>
            <p className="font-medium text-slate-800">{app.applicant?.orgName || app.applicant?.name}</p>
            <p className="text-sm text-slate-500">{app.applicant?.email}</p>
            <p className="text-sm text-slate-500">{app.applicant?.phone}</p>
            <p className="text-sm text-slate-500">{app.applicant?.address}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="blue">Applicant</Badge>
              {app.type === "NEW" ? <Badge tone="blue">NEW</Badge> : <Badge tone="purple">REVERIFICATION</Badge>}
            </div>
          </Card>

          {(canAssign || user.role === "ADMIN") && ["SUBMITTED", "SCHEDULED"].includes(app.status) && (
            <Card className="p-5">
              <h3 className="mb-2 font-semibold text-slate-900">Officer actions</h3>
              {!app.assignedTo && (
                <Button className="mb-2 w-full justify-center" onClick={openAssign}><Calendar size={16} /> Schedule & Assign</Button>
              )}
              {app.assignedToId === user.id && app.status === "SCHEDULED" && (
                <Button className="w-full justify-center" variant="primary" onClick={() => transition("IN_PROGRESS")}>Mark In Progress</Button>
              )}
              {app.assignedToId === user.id && ["SCHEDULED", "IN_PROGRESS"].includes(app.status) && (
                <button onClick={() => navigate(`/app/verify?applicationId=${app.id}`)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  <BadgeCheck size={16} /> Record Verification & Issue Certificate
                </button>
              )}
              {app.assignedTo && user.role === "ADMIN" && (
                <Button variant="secondary" className="w-full justify-center" onClick={openAssign}><UserCheck size={16} /> Re-assign</Button>
              )}
              {canAssign && app.status === "IN_PROGRESS" && (
                <br />
              )}
            </Card>
          )}

          {isOwner && ["SUBMITTED", "SCHEDULED"].includes(app.status) && (
            <Card className="p-5">
              <h3 className="mb-2 font-semibold text-slate-900">Applicant actions</h3>
              <Button variant="danger" className="w-full justify-center" onClick={async () => { if (confirm("Cancel this application?")) { await api.patch(`/applications/${app.id}/status`, { status: "CANCELLED" }); load(); } }}>
                Cancel application
              </Button>
            </Card>
          )}

          {app.verification && (
            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-slate-900">{app.verification.result === "PASS" ? "Verification result" : "Result"}</h3>
              <div className="mb-2"><Badge tone={app.verification.result === "PASS" ? "green" : "red"}>{app.verification.result}</Badge></div>
              <p className="text-sm text-slate-600">{app.verification.observations}</p>
              <p className="mt-2 text-xs text-slate-500">Verified by {app.verification.officer?.name} · {fmtDateTime(app.verification.verifiedAt)}</p>
              {app.verification.certificate && (
                <Link to={`/app/certificates/${app.verification.certificate.id}`} className="mt-3 block rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100">
                  View digital certificate →</Link>
              )}
            </Card>
          )}
        </div>
      </div>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Schedule & assign verification">
        <form onSubmit={submitAssign} className="space-y-4">
          <Field label="Verifying authority" required>
            <select className={inputCls} required value={assignForm.assignedToId} onChange={(e) => setAssignForm({ ...assignForm, assignedToId: e.target.value })}>
              <option value="">Select officer / GATC</option>
              {assignees.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.role}){a.district ? ` · ${a.district}` : ""}</option>)}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assign as">
              <select className={inputCls} value={assignForm.assignedToType} onChange={(e) => setAssignForm({ ...assignForm, assignedToType: e.target.value })}>
                <option value="LMO">Legal Metrology Officer</option>
                <option value="GATC">Approved Test Centre</option>
              </select>
            </Field>
            <Field label="Scheduled date">
              <input className={inputCls} type="date" value={assignForm.scheduledDate} onChange={(e) => setAssignForm({ ...assignForm, scheduledDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Verification fee (INR)">
            <input className={inputCls} type="number" min="0" value={assignForm.feeAmount} onChange={(e) => setAssignForm({ ...assignForm, feeAmount: e.target.value })} placeholder="e.g. 1200" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Assign & Schedule"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}