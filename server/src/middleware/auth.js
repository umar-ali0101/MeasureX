import { verifyToken } from "../lib/auth.js";
import prisma from "../lib/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing token" });

    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE")
      return res.status(401).json({ error: "Invalid or inactive account" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: "Forbidden" });
  next();
};
