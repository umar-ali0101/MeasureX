const BASE = "/api";

export const getToken = () => localStorage.getItem("lm_token");
export const setToken = (t) => localStorage.setItem("lm_token", t);
export const clearToken = () => localStorage.removeItem("lm_token");

async function request(path, { method = "GET", body, formData } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const err = new Error(typeof data === "object" ? data.error || res.statusText : res.statusText);
    err.status = res.status;
    if (res.status === 401) {
      clearToken();
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", formData }),
};

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
export const fmtMoney = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
export const daysLeft = (date) => Math.ceil((new Date(date) - new Date()) / 86400000);