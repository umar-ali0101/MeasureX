import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { inputCls, Button, Card, Field } from "../components/ui.jsx";

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "BUSINESS", orgName: "", phone: "", state: "", district: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      localStorage.setItem("lm_token", data.token);
      login(form.email, form.password).then(() => navigate("/app")).catch(() => navigate("/app"));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-brand-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-lg">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-white font-bold">LM</div>
          <div className="text-left">
            <p className="font-semibold text-slate-900">LM Verify</p>
            <p className="text-xs text-slate-500">Legal Metrology Digital Certification</p>
          </div>
        </Link>
        <Card className="p-6">
          <h1 className="text-lg font-bold text-slate-900">Create stakeholder account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Register as a business user, Legal Metrology Officer or Approved Test Centre.
          </p>
          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <input className={inputCls} required value={form.name} onChange={set("name")} placeholder="Name of user" />
              </Field>
              <Field label="Email" required>
                <input className={inputCls} type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password" required hint="Minimum 6 characters">
                <input className={inputCls} type="password" required minLength={6} value={form.password} onChange={set("password")} />
              </Field>
              <Field label="Phone">
                <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="+91 98xxxxxx" />
              </Field>
            </div>
            <Field label="Stakeholder type" required>
              <select className={inputCls} value={form.role} onChange={set("role")}>
                <option value="BUSINESS">Business / Instrument User</option>
                <option value="LMO">Legal Metrology Officer</option>
                <option value="GATC">Approved Test Centre</option>
              </select>
            </Field>
            <Field label="Organization name">
              <input className={inputCls} value={form.orgName} onChange={set("orgName")} placeholder="Company / Department" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="State">
                <input className={inputCls} value={form.state} onChange={set("state")} />
              </Field>
              <Field label="District">
                <input className={inputCls} value={form.district} onChange={set("district")} />
              </Field>
            </div>
            <Button type="submit" disabled={busy} className="w-full justify-center" size="lg">
              {busy ? "Creating account..." : "Register"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-brand-700 hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}