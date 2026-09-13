import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import {
  hashPassword,
  comparePassword,
  signToken,
  publicUser,
} from "../lib/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(120),
  password: z.string().min(6).max(72),
  role: z.enum(["BUSINESS", "LMO", "GATC"]),
  phone: z.string().max(20).optional(),
  orgName: z.string().max(160).optional(),
  gstin: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  state: z.string().max(60).optional(),
  district: z.string().max(60).optional(),
  pincode: z.string().max(10).optional(),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const { password, ...userData } = data;
    const user = await prisma.user.create({
      data: {
        ...userData,
        email: userData.email.toLowerCase(),
        passwordHash: await hashPassword(password),
        status: "ACTIVE",
      },
    });

    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.status === "SUSPENDED")
      return res.status(403).json({ error: "Account suspended" });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res) => res.json({ user: publicUser(req.user) }));

export default router;