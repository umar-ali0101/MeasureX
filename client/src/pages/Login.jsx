import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { inputCls, Button, Card } from "../components/ui.jsx";

const demo = {
  admin: { email: "admin@lm.gov.in", password: "admin123" },
  lmo: { email: "lmo@lm.gov.in", password: "lmo123" },
  gatc: { email: "gatc@lm.gov.in", password: "gatc123" },
  business: { email: "business@example.com", password: "business123" },
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const quick = (role) => {
    setEmail(demo[role].email);
    setPassword(demo[role].password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-brand-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-white font-bold">LM</div>
          <div className="text-left">
            <p className="font-semibold text-slate-900">LM Verify</p>
            <p className="text-xs text-slate-500">Legal Metrology Digital Certification</p>
          </div>
        </Link>
        <Card className="p-6">
          <h1 className="text-lg font-bold text-slate-900">Sign in to your account</h1>
          <p className="mt-1 text-sm text-slate-500">Role-based secure access for stakeholders.</p>
          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input className={inputCls} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={busy} className="w-full justify-center" size="lg">
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            New user?{" "}
            <Link to="/register" className="font-medium text-brand-700 hover:underline">Create an account</Link>
          </p>
        </Card>
        <div className="mt-4">
          <p className="mb-2 text-center text-xs font-medium text-slate-500">One-click demo access</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(demo).map(([role, cred]) => (
              <button key={role} onClick={() => quick(role)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-brand-500 hover:bg-brand-50">
                <span className="font-semibold capitalize text-slate-800">{role}</span>
                <span className="mt-0.5 block truncate text-slate-500">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}