import crypto from "crypto";

export const newApplicationNo = () =>
  `LM-APP-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;

export const newCertificateNo = () =>
  `LM-CERT-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;

export const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

export const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

export const daysBetween = (a, b) =>
  Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
