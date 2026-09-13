import { Router } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { newCertificateNo, sha256, addYears } from "../lib/helpers.js";

const router = Router();
router.use(authenticate);

const verifySchema = z.object({
  applicationId: z.string(),
  result: z.enum(["PASS", "FAIL"]),
  observations: z.string().max(2000).optional(),
  validityYears: z.number().int().min(1).max(10).default(1),
  nextDueDate: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === "LMO" || req.user.role === "GATC") where.officerId = req.user.id;
    if (req.user.role === "BUSINESS")
      where.instrument = { ownerId: req.user.id };

    const verifications = await prisma.verification.findMany({
      where,
      include: {
        certificate: true,
        instrument: { include: { owner: { select: { name: true, orgName: true } } } },
        officer: { select: { id: true, name: true, role: true } },
        application: { select: { applicationNo: true } },
      },
      orderBy: { verifiedAt: "desc" },
    });
    res.json(verifications);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const verification = await prisma.verification.findFirstOrThrow({
      where: { id: req.params.id },
      include: {
        certificate: true,
        instrument: true,
        officer: { select: { name: true, role: true, phone: true, email: true } },
        application: { include: { applicant: { select: { name: true, orgName: true } } } },
      },
    });
    res.json(verification);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!["LMO", "GATC", "ADMIN"].includes(req.user.role))
      return res.status(403).json({ error: "Only LMOs/GATCs can verify" });

    const data = verifySchema.parse(req.body);
    const application = await prisma.application.findFirstOrThrow({
      where: { id: data.applicationId },
      include: { instrument: true },
    });

    if (application.status === "VERIFIED")
      return res.status(409).json({ error: "Application already verified" });
    if (application.assignedToId !== req.user.id && req.user.role !== "ADMIN")
      return res.status(403).json({ error: "Not assigned to you" });

    const validityYears = Math.max(1, Math.min(10, data.validityYears || 1));
    const verifiedAt = new Date();
    const validFrom = verifiedAt;
    const validUntil = data.nextDueDate
      ? new Date(data.nextDueDate)
      : addYears(verifiedAt, validityYears);

    const verification = await prisma.$transaction(async (tx) => {
      const v = await tx.verification.create({
        data: {
          applicationId: application.id,
          instrumentId: application.instrumentId,
          officerId: req.user.id,
          result: data.result,
          observations: data.observations,
          verifiedAt,
          nextDueDate: data.result === "PASS" ? validUntil : null,
          ...(data.result === "PASS" ? {} : {}),
        },
      });

      await tx.application.update({
        where: { id: application.id },
        data: { status: "VERIFIED" },
      });

      await tx.instrument.update({
        where: { id: application.instrumentId },
        data: {
          status: data.result === "PASS" ? "VERIFIED" : "REJECTED",
          stampingYear: data.result === "PASS" ? verifiedAt.getFullYear() : undefined,
        },
      });

      let certificate = null;
      if (data.result === "PASS") {
        const certNo = newCertificateNo();
        const uniqueValue = `${certNo}|${application.instrumentId}|${verifiedAt.toISOString()}|${validUntil.toISOString()}`;
        const verificationHash = sha256(uniqueValue);
        const publicUrl = `${process.env.PUBLIC_URL || "http://localhost:4000"}/api/certificates/verify/${certNo}`;
        const qrData = await QRCode.toDataURL(publicUrl, { width: 320, margin: 1 });

        certificate = await tx.certificate.create({
          data: {
            certificateNo: certNo,
            verificationId: v.id,
            validFrom,
            validUntil,
            qrData,
            verificationHash,
            status: "VALID",
          },
        });

        await tx.alert.create({
          data: {
            userId: application.applicantId,
            instrumentId: application.instrumentId,
            type: "EXPIRY",
            title: "Certificate issued",
            message: `Certificate ${certNo} for ${application.instrument.name} (${application.instrument.serialNo}) is valid until ${validUntil.toISOString().slice(0, 10)}.`,
            dueDate: validUntil,
          },
        });

        const reminderDate = new Date(validUntil);
        reminderDate.setDate(reminderDate.getDate() - 30);
        await tx.alert.create({
          data: {
            userId: application.applicantId,
            instrumentId: application.instrumentId,
            type: "DUE",
            title: "Re-verification due soon",
            message: `${application.instrument.name} (${application.instrument.serialNo}) verification expires on ${validUntil.toISOString().slice(0, 10)}. Please apply for re-verification.`,
            dueDate: reminderDate,
          },
        });
      }

      return { verification: v, certificate };
    });

    res.status(201).json(verification);
  } catch (err) {
    next(err);
  }
});

export { router };
export default router;