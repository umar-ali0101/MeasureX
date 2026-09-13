import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellRing, Trash2, CheckCheck } from "lucide-react";
import { api, fmtDate, daysLeft } from "../api.js";
import { Card, Button, Badge, Spinner, Empty, PageHead } from "../components/ui.jsx";

const typeTone = { EXPIRY: "red", DUE: "amber", APPLICATION: "blue", SYSTEM: "slate" };

export function Alerts() {
  const [items, setItems] = useState(null);
  const load = (unreadOnly = false) => api.get(`/alerts${unreadOnly ? "?unread=true" : ""}`).then(setItems);
  useEffect(() => { load(); }, []);

  if (!items) return <Spinner />;

  return (
    <>
      <PageHead
        title="Alerts & Reminders"
        subtitle="Expiry warnings and application notifications"
        actions={<Button variant="secondary" onClick={async () => { await api.patch("/alerts/read-all", {}); load(); }}><CheckCheck size={16} /> Mark all read</Button>}
      />
      {items.length === 0 ? (
        <Card><Empty icon={Bell} title="No alerts" message="You're all caught up." /></Card>
      ) : (
        <div className="space-y-2">
          {items.map((a) => {
            const days = a.dueDate ? daysLeft(a.dueDate) : null;
            return (
              <Card key={a.id} className={`flex items-start justify-between gap-3 p-4 ${!a.isRead ? "border-brand-300" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-lg p-2 ${a.isRead ? "bg-slate-100 text-slate-400" : "bg-brand-50 text-brand-700"}`}>
                    {a.isRead ? <Bell size={18} /> : <BellRing size={18} />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-800">{a.title}</p>
                      <Badge tone={typeTone[a.type] || "slate"}>{a.type}</Badge>
                      {!a.isRead && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-800">NEW</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{a.message}</p>
                    <div className="mt-1 text-xs text-slate-400">
                      {a.instrument && <Link to={`/app/instruments/${a.instrument.id}`} className="text-brand-700 hover:underline">{a.instrument.name}</Link>}
                      {days !== null && <span> · due {fmtDate(a.dueDate)} ({days < 0 ? `${-days} days ago` : `in ${days} days`})</span>}
                      <span> · {fmtDate(a.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!a.isRead && <Button size="sm" variant="ghost" onClick={async () => { await api.patch(`/alerts/${a.id}/read`, {}); load(); }}>Mark read</Button>}
                  <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete alert?")) { await api.del(`/alerts/${a.id}`); load(); } }}><Trash2 size={15} /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}