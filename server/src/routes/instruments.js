import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

const instrumentSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(80),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNo: z.string().min(1).max(80),
  capacity: z.string().max(60).optional(),
  leastCount: z.string().max(60).optional(),
  accuracyClass: z.string().max(60).optional(),
  stampingYear: z.number().int().min(1990).max(2100).optional(),
  location: z.string().max(200).optional(),
  state: z.string().max(60).optional(),
  district: z.string().max(60).optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const { q, status } = req.query;
    const isOwner =
      req.user.role === "ADMIN" || req.user.role === "LMO" || req.user.role === "GATC";

    const where = { ...(status ? { status } : {}) };
    if (!isOwner) where.ownerId = req.user.id;
    if (q)
      where.OR = [
        { name: { contains: q } },
        { serialNo: { contains: q } },
        { make: { contains: q } },
      ];

    const instruments = await prisma.instrument.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, orgName: true, email: true, phone: true },
        },
        verifications: {
          include: { certificate: true, officer: { select: { name: true } } },
          orderBy: { verifiedAt: "desc" },
          take: 1,
        },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(instruments);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const instrument = await prisma.instrument.findFirstOrThrow({
      where: { id: req.params.id },
      include: {
        owner: {
          select: { id: true, name: true, orgName: true, email: true, phone: true },
        },
        verifications: {
          include: {
            certificate: true,
            officer: { select: { name: true } },
            application: { select: { applicationNo: true } },
          },
          orderBy: { verifiedAt: "desc" },
        },
        applications: {
          include: { applicant: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (instrument.ownerId !== req.user.id && !["ADMIN", "LMO", "GATC"].includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    res.json(instrument);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!["BUSINESS", "ADMIN"].includes(req.user.role))
      return res.status(403).json({ error: "Only businesses can register instruments" });
    const data = instrumentSchema.parse(req.body);
    const instrument = await prisma.instrument.create({
      data: { ...data, ownerId: req.user.role === "ADMIN" ? req.body.ownerId || req.user.id : req.user.id },
    });
    res.status(201).json(instrument);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.instrument.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.ownerId !== req.user.id && req.user.role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden" });
    const data = instrumentSchema.partial().parse(req.body);
    const instrument = await prisma.instrument.update({
      where: { id: req.params.id },
      data,
    });
    res.json(instrument);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.instrument.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const appCount = await prisma.application.count({ where: { instrumentId: req.params.id } });
    if (appCount > 0)
      return res.status(409).json({ error: "Cannot delete; instrument has verification history" });
    if (existing.ownerId !== req.user.id && req.user.role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden" });
    await prisma.instrument.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;