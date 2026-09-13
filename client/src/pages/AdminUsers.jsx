import { useEffect, useState } from "react";
import { Users, Building2, ShieldCheck, Search } from "lucide-react";
import { api, fmtDate } from "../api.js";
import { Card, Badge, StatusBadge, Spinner, Empty, Button, PageHead, inputCls } from "../components/ui.jsx";

const roleTone = { ADMIN: "red", LMO: "blue", GATC: "purple", BUSINESS: "green" };

export function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [filters, setFilters] = useState({ role: "", q: "" });

  const load = () => api.get(`/users?role=${filters.role}`).then(setUsers);
  useEffect(() => { load(); }, [filters.role]);

  if (!users) return <Spinner />;

  const filtered = filters.q
    ? users.filter((u) => [u.name, u.email, u.orgName].some((v) => v?.toLowerCase().includes(filters.q.toLowerCase())))
    : users;

  const toggle = async (u) => {
    const next = u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    if (!confirm(`${next === "ACTIVE" ? "Activate" : "Suspend"} account for ${u.name}?`)) return;
    await api.patch(`/users/${u.id}/status`, { status: next });
    load();
  };

  return (
    <>
      <PageHead title="Users & Role Management" subtitle="Manage stakeholder accounts across the ecosystem" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {["", "ADMIN", "LMO", "GATC", "BUSINESS"].map((r) => (
            <button key={r} onClick={() => setFilters({ ...filters, role: r })} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filters.role === r ? "bg-brand-700 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
              {r || "ALL"}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9 max-w-xs`} placeholder="Search name / email..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><Empty icon={Users} title="No users found" /></Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.orgName}</p>
                  </td>
                  <td className="px-4 py-3"><Badge tone={roleTone[u.role]}>{u.role}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{u.email}</p>
                    <p className="text-xs text-slate-400">{u.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.district ? `${u.district}, ${u.state}` : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "ADMIN" && (
                      <Button size="sm" variant={u.status === "SUSPENDED" ? "success" : "danger"} onClick={() => toggle(u)}>
                        {u.status === "SUSPENDED" ? "Activate" : "Suspend"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-600"><ShieldCheck size={18} className="text-brand-600" /> Administrators manage all accounts and enforcement monitoring.</Card>
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-600"><Building2 size={18} className="text-sky-600" /> Officers & GATCs can be assigned to verification applications.</Card>
        <Card className="flex items-center gap-3 p-4 text-sm text-slate-600"><Users size={18} className="text-emerald-600" /> Suspended accounts cannot sign in.</Card>
      </div>
    </>
  );
}