import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === "BUSINESS")
      where.verification = { instrument: { ownerId: req.user.id } };

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        verification: {
          include: {
            instrument: { include: { owner: { select: { name: true, orgName: true } } } },
            officer: { select: { name: true, role: true } },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });
    res.json(certificates);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const certificate = await prisma.certificate.findFirstOrThrow({
      where: { id: req.params.id },
      include: {
        verification: {
          include: {
            instrument: { include: { owner: true } },
            officer: { select: { name: true, role: true } },
          },
        },
      },
    });
    res.json(certificate);
  } catch (err) {
    next(err);
  }
});

// PUBLIC certificate verification endpoint — accessible without auth (QR scan target)
router.get("/verify/:certNo", async (req, res, next) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNo: req.params.certNo },
      include: {
        verification: {
          include: {
            instrument: { include: { owner: { select: { name: true, orgName: true } } } },
            officer: { select: { name: true, role: true, phone: true } },
          },
        },
      },
    });
    if (!certificate) return res.status(404).json({ error: "Certificate not found" });

    const now = new Date();
    const status =
      certificate.status === "REVOKED"
        ? "REVOKED"
        : now > certificate.validUntil
          ? "EXPIRED"
          : "VALID";

    res.json({
      certificateNo: certificate.certificateNo,
      status,
      validFrom: certificate.validFrom,
      validUntil: certificate.validUntil,
      hash: certificate.verificationHash,
      instrument: certificate.verification.instrument,
      officer: certificate.verification.officer,
      verifiedAt: certificate.verification.verifiedAt,
      result: certificate.verification.result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;