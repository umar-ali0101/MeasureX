import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Scale, FileText, BadgeCheck, AlertTriangle, Users, ArrowRight, Clock, Building2, UserCheck, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { api, fmtDate, daysLeft } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Card, Spinner, Badge, Empty, PageHead } from "../components/ui.jsx";

const PIE_COLORS = ["#0d9488", "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#94a3b8"];

function StatCard({ icon: Icon, label, value, sub, to, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    blue: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    violet: "bg-violet-50 text-violet-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  const inner = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      <div className={`rounded-lg p-2.5 ${tones[tone]}`}>
        <Icon size={20} />
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 hover:shadow">
      {inner}
    </Link>
  ) : (
    <Card className="p-4">{inner}</Card>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then(setData).catch(() => setData(null));
  }, [user]);

  if (!data) return <Spinner label="Loading dashboard..." />;

  if (user.role === "BUSINESS") {
    const c = data.cards;
    return (
      <>
        <PageHead
          title={`Welcome, ${user.name.split(" ")[0]}`}
          subtitle="Your verification compliance overview"
          actions={<Link to="/app/applications/new" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"><FileText size={16} /> Apply for Verification</Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Scale} label="Registered Instruments" value={c.instruments} to="/app/instruments" />
          <StatCard icon={BadgeCheck} label="Currently Verified" value={c.verified} tone="green" to="/app/certificates" />
          <StatCard icon={AlertTriangle} label="Applications Pending" value={c.pendingApps} tone="amber" to="/app/applications" />
          <StatCard icon={Clock} label="Expiring in 60 days" value={c.expiringSoonCount} tone="red" to="/app/certificates" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Certificates expiring soon</h3>
            {data.expiringSoon?.length ? (
              <div className="space-y-2">
                {data.expiringSoon.map((crt) => {
                  const d = daysLeft(crt.validUntil);
                  return (
                    <div key={crt.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{crt.verification.instrument.name}</p>
                        <p className="text-xs text-slate-500">{crt.certificateNo} · {crt.verification.instrument.serialNo}</p>
                      </div>
                      <div className="text-right">
                        <Badge tone={d <= 30 ? "red" : "amber"}>{d} days left</Badge>
                        <p className="mt-0.5 text-[11px] text-slate-500">{fmtDate(crt.validUntil)}</p>
                      </div>
                    </div>
                  );
                })}
                <Link to="/app/applications/new" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                  Apply for re-verification <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <Empty icon={BadgeCheck} title="No expiring certificates" message="Your verified instruments are safe for now." />
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Recent certificates</h3>
            {data.recentCertificates?.length ? (
              <div className="space-y-2">
                {data.recentCertificates.map((crt) => (
                  <Link key={crt.id} to={`/app/certificates/${crt.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{crt.verification.instrument.name}</p>
                      <p className="text-xs text-slate-500">{crt.verification.instrument.serialNo}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone="green">VALID</Badge>
                      <p className="mt-0.5 text-[11px] text-slate-500">Valid till {fmtDate(crt.validUntil)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty icon={Scale} title="No certificates yet" message="Once verified, your digital certificates appear here." />
            )}
          </Card>
        </div>
      </>
    );
  }

  if (user.role === "LMO" || user.role === "GATC") {
    const c = data.cards;
    return (
      <>
        <PageHead
          title={`Field work queue · ${user.name}`}
          subtitle={user.role === "LMO" ? "Legal Metrology Officer" : "Approved Test Centre"}
          actions={<Link to="/app/verify" className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"><BadgeCheck size={16} /> Perform Verification</Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FileText} label="Assigned Applications" value={c.totalAssigned} to="/app/applications" />
          <StatCard icon={Clock} label="Pending Verification" value={c.pending} tone="amber" to="/app/applications" />
          <StatCard icon={BadgeCheck} label="Completed (All time)" value={c.done} tone="green" />
          <StatCard icon={ShieldCheck} label="Completed this month" value={c.verifiedThisMonth} tone="violet" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Verification queue</h3>
            {data.queue?.length ? (
              <div className="space-y-2">
                {data.queue.map((app) => (
                  <Link key={app.id} to={`/app/applications/${app.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{app.instrument.name} <span className="text-xs text-slate-400">· {app.instrument.serialNo}</span></p>
                      <p className="text-xs text-slate-500">{app.applicant.orgName || app.applicant.name} · {app.type}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone="amber">{app.status}</Badge>
                      <p className="mt-0.5 text-[11px] text-slate-500">{app.scheduledDate ? fmtDate(app.scheduledDate) : "Unassigned"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty icon={Clock} title="Queue is clear" message="No pending verifications assigned to you." />
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Recent verifications</h3>
            {data.recentVerifications?.length ? (
              <div className="space-y-2">
                {data.recentVerifications.map((v) => (
                  <Link key={v.id} to={`/app/verifications/${v.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{v.instrument.name}</p>
                      <p className="text-xs text-slate-500">{v.application.applicationNo}</p>
                    </div>
                    <div className="text-right">
                      <Badge tone={v.result === "PASS" ? "green" : "red"}>{v.result}</Badge>
                      <p className="mt-0.5 text-[11px] text-slate-500">{fmtDate(v.verifiedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty icon={BadgeCheck} title="No verifications yet" message="Record your first field verification." />
            )}
          </Card>
        </div>
      </>
    );
  }

  // ADMIN
  const c = data.cards;
  const pieData = (data.statusBreakdown || []).map((s) => ({ name: s.status, value: s.count }));
  const barData = [{ name: "New Applications", count: c.newApplications }, { name: "Certificates Issued", count: c.certificates30 }, { name: "Total Certificates", count: c.certificates }, { name: "Verifications", count: c.verifications }];

  return (
    <>
      <PageHead title="National Monitoring Dashboard" subtitle="Verification status, pendency and enforcement across the ecosystem" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Registered Users" value={c.users} sub={`${c.businesses} businesses`} to="/app/users" />
        <StatCard icon={Building2} label="Officers & GATCs" value={c.officers} tone="blue" to="/app/users" />
        <StatCard icon={Scale} label="Instruments" value={c.instruments} sub={`${c.verifiedInstruments} verified`} to="/app/instruments" />
        <StatCard icon={FileText} label="Applications" value={c.applications} sub={`${c.pendingApps} pending`} tone="amber" to="/app/applications" />
        <StatCard icon={BadgeCheck} label="Certificates Issued" value={c.certificates} sub={`${c.certificates30} this month`} tone="green" to="/app/certificates" />
        <StatCard icon={Clock} label="Pending Applications" value={c.pendingApps} tone="red" to="/app/applications" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Lifecycle activity (month)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Applications by status</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} label={({ name }) => name} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty icon={FileText} title="No application data" />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Pending applications</h3>
          {data.pendingList?.length ? (
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {data.pendingList.map((app) => (
                <Link key={app.id} to={`/app/applications/${app.id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{app.instrument.name}</p>
                    <p className="truncate text-xs text-slate-500">{app.applicationNo} · {app.applicant.orgName || app.applicant.name}</p>
                  </div>
                  <Badge tone="amber">{app.status}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <Empty icon={Clock} title="Zero pendency" message="All applications are moving smoothly." />
          )}
        </Card>
      </div>
    </>
  );
}