import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { newApplicationNo } from "../lib/helpers.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  instrumentId: z.string(),
  type: z.enum(["NEW", "REVERIFICATION"]),
  preferredDate: z.string().optional(),
  remarks: z.string().max(500).optional(),
});

const assignSchema = z.object({
  assignedToId: z.string(),
  assignedToType: z.enum(["LMO", "GATC"]),
  scheduledDate: z.string().optional(),
  feeAmount: z.number().min(0).optional(),
});

const LMO_GATC = ["LMO", "GATC"];

router.get("/", async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { ...(status ? { status } : {}) };

    if (req.user.role === "BUSINESS") where.applicantId = req.user.id;
    else if (LMO_GATC.includes(req.user.role)) where.assignedToId = req.user.id;

    const applications = await prisma.application.findMany({
      where,
      include: {
        instrument: {
          include: { owner: { select: { name: true, orgName: true } } },
        },
        applicant: { select: { id: true, name: true, orgName: true } },
        assignedTo: {
          select: { id: true, name: true, role: true, phone: true, email: true },
        },
        verification: { include: { certificate: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!["BUSINESS", "ADMIN"].includes(req.user.role))
      return res.status(403).json({ error: "Only businesses can apply" });

    const data = createSchema.parse(req.body);
    const instrument = await prisma.instrument.findUnique({
      where: { id: data.instrumentId },
    });
    if (!instrument) return res.status(404).json({ error: "Instrument not found" });

    if (data.type === "NEW" && instrument.status === "VERIFIED")
      return res.status(400).json({ error: "Instrument is already verified under current stamping" });

    const openApp = await prisma.application.findFirst({
      where: {
        instrumentId: data.instrumentId,
        status: { in: ["SUBMITTED", "SCHEDULED", "IN_PROGRESS"] },
      },
    });
    if (openApp)
      return res.status(409).json({ error: "An active application already exists for this instrument" });

    const ownerId =
      req.user.role === "ADMIN" && req.user.id !== instrument.ownerId
        ? instrument.ownerId
        : req.user.id;

    const application = await prisma.application.create({
      data: {
        applicationNo: newApplicationNo(),
        instrumentId: data.instrumentId,
        applicantId: ownerId,
        type: data.type,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        remarks: data.remarks,
        status: "SUBMITTED",
      },
    });

    await prisma.alert.create({
      data: {
        userId: ownerId,
        instrumentId: data.instrumentId,
        type: "APPLICATION",
        title: "Application submitted",
        message: `Application ${application.applicationNo} for ${instrument.name} (${instrument.serialNo}) has been submitted.`,
      },
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const app = await prisma.application.findFirstOrThrow({
      where: { id: req.params.id },
      include: {
        instrument: {
          include: { owner: { select: { name: true, orgName: true, email: true, phone: true } } },
        },
        applicant: { select: { id: true, name: true, orgName: true, phone: true, email: true, address: true } },
        assignedTo: { select: { id: true, name: true, role: true, phone: true, email: true, state: true, district: true } },
        verification: { include: { certificate: true, officer: { select: { name: true, role: true } } } },
        documents: { include: { uploader: { select: { name: true } } } },
      },
    });
    const canView =
      req.user.role === "ADMIN" ||
      app.applicantId === req.user.id ||
      app.assignedToId === req.user.id;
    if (!canView) return res.status(403).json({ error: "Forbidden" });
    res.json(app);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/assign", async (req, res, next) => {
  try {
    if (!LMO_GATC.includes(req.user.role) && req.user.role !== "ADMIN")
      return res.status(403).json({ error: "Forbidden" });

    const data = assignSchema.parse(req.body);
    const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId } });
    if (!assignee || !LMO_GATC.includes(assignee.role))
      return res.status(400).json({ error: "Invalid assignee" });

    const app = await prisma.application.findFirstOrThrow({ where: { id: req.params.id } });
    if (!["SUBMITTED", "SCHEDULED"].includes(app.status))
      return res.status(409).json({ error: "Application cannot be re-assigned in current status" });

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        assignedToId: data.assignedToId,
        assignedToType: data.assignedToType,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : app.scheduledDate,
        feeAmount: data.feeAmount ?? app.feeAmount,
        status: "SCHEDULED",
      },
    });

    await prisma.alert.createMany({
      data: [
        {
          userId: app.applicantId,
          instrumentId: app.instrumentId,
          type: "APPLICATION",
          title: "Verification scheduled",
          message: `Application ${app.applicationNo} scheduled for ${updated.scheduledDate?.toISOString().slice(0, 10)} with ${assignee.name} (${assignee.role}).`,
        },
        {
          userId: data.assignedToId,
          instrumentId: app.instrumentId,
          type: "APPLICATION",
          title: "New assignment",
          message: `You have been assigned verification for application ${app.applicationNo}.`,
        },
      ],
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.string().min(3) }).parse(req.body);
    const app = await prisma.application.findFirstOrThrow({ where: { id: req.params.id } });

    const isOwner = app.applicantId === req.user.id;
    const isLmoGatc = LMO_GATC.includes(req.user.role) && app.assignedToId === req.user.id;

    if (status === "CANCELLED" && (isOwner || ["ADMIN", "LMO"].includes(req.user.role))) {
      const updated = await prisma.application.update({
        where: { id: req.params.id },
        data: { status },
      });
      return res.json(updated);
    }
    if (isLmoGatc || req.user.role === "ADMIN") {
      if (["SUBMITTED", "SCHEDULED"].includes(app.status) && ["SCHEDULED", "IN_PROGRESS"].includes(status)) {
        const updated = await prisma.application.update({
          where: { id: req.params.id },
          data: { status },
        });
        return res.json(updated);
      }
    }
    return res.status(409).json({ error: "Invalid transition" });
  } catch (err) {
    next(err);
  }
});

export default router;