import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const role = req.user.role;
    const uid = req.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    if (role === "BUSINESS") {
      const ownWhere = { ownerId: uid };
      const [instruments, verified, expired, expiring, applications, pendingApps, alertsUnread, recentCertificates] = await Promise.all([
        prisma.instrument.count({ where: ownWhere }),
        prisma.instrument.count({ where: { ...ownWhere, status: "VERIFIED" } }),
        prisma.instrument.count({ where: { ...ownWhere, status: "EXPIRED" } }),
        prisma.instrument.count({
          where: {
            ...ownWhere,
            verifications: { some: { certificate: { validUntil: { gte: now } } } },
          },
        }),
        prisma.application.count({ where: { applicantId: uid } }),
        prisma.application.count({ where: { applicantId: uid, status: { in: ["SUBMITTED", "SCHEDULED", "IN_PROGRESS"] } } }),
        prisma.alert.count({ where: { userId: uid, isRead: false } }),
        prisma.certificate.findMany({
          where: { verification: { instrument: { ownerId: uid } } },
          include: { verification: { include: { instrument: true } } },
          orderBy: { issuedAt: "desc" },
          take: 5,
        }),
      ]);

      const expiringSoon = await prisma.certificate.findMany({
        where: {
          verification: { instrument: { ownerId: uid } },
          validUntil: { gte: now, lte: new Date(now.getTime() + 60 * 86400000) },
          status: "VALID",
        },
        include: { verification: { include: { instrument: true } } },
        orderBy: { validUntil: "asc" },
      });

      return res.json({
        cards: {
          instruments,
          verified,
          expired,
          applutations: applications,
          applications,
          pendingApps,
          expiringSoonCount: expiringSoon.length,
          alertsUnread,
        },
        applications,
        pendingApplications: pendingApps,
        expiringSoon,
        recentCertificates,
        certCount: expiringSoon.length,
      });
    }

    if (role === "LMO" || role === "GATC") {
      const assignedApps = { assignedToId: uid };
      const [totalAssigned, pending, done, verifiedThisMonth, doneTotal, instruments] = await Promise.all([
        prisma.application.count({ where: assignedApps }),
        prisma.application.count({ where: { ...assignedApps, status: { in: ["SUBMITTED", "SCHEDULED", "IN_PROGRESS"] } } }),
        prisma.verification.count({ where: { officerId: uid } }),
        prisma.verification.count({ where: { officerId: uid, verifiedAt: { gte: monthStart } } }),
        prisma.verification.count({ where: { officerId: uid } }),
        prisma.instrument.count({ where: { status: "VERIFIED" } }),
      ]);

      const recentVerifications = await prisma.verification.findMany({
        where: { officerId: uid },
        include: { instrument: true, application: { select: { applicationNo: true } }, certificate: true },
        orderBy: { verifiedAt: "desc" },
        take: 5,
      });

      const queue = await prisma.application.findMany({
        where: { ...assignedApps, status: { in: ["SUBMITTED", "SCHEDULED", "IN_PROGRESS"] } },
        include: { instrument: true, applicant: { select: { name: true, orgName: true } } },
        orderBy: { scheduledDate: "asc" },
        take: 10,
      });

      return res.json({
        cards: { totalAssigned, pending, done, verifiedThisMonth },
        pendingApplications: pending,
        doneTotal,
        instruments,
        queue,
        recentVerifications,
      });
    }

    // ADMIN
    const [users, businesses, officers, instruments, verifiedInstruments, applications, pendingApps, verifications, certificates, certificates30, newApplications] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "BUSINESS" } }),
      prisma.user.count({ where: { role: { in: ["LMO", "GATC"] } } }),
      prisma.instrument.count(),
      prisma.instrument.count({ where: { status: "VERIFIED" } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: { in: ["SUBMITTED", "SCHEDULED", "IN_PROGRESS"] } } }),
      prisma.verification.count(),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { issuedAt: { gte: monthStart } } }),
      prisma.application.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    const [pendingList, recentCertificates, recentApplications, statusBreakdown] = await Promise.all([
      prisma.application.findMany({
        where: { status: { in: ["SUBMITTED", "SCHEDULED", "IN_PROGRESS"] } },
        include: { instrument: true, applicant: { select: { name: true, orgName: true } }, assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
        take: 15,
      }),
      prisma.certificate.findMany({
        include: { verification: { include: { instrument: true } } },
        orderBy: { issuedAt: "desc" },
        take: 8,
      }),
      prisma.application.findMany({
        include: { instrument: true, applicant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return res.json({
      cards: {
        users,
        businesses,
        officers,
        instruments,
        verifiedInstruments,
        applications,
        pendingApps,
        verifications,
        certificates,
        certificates30,
        newApplications,
      },
      pendingApplications: pendingApps,
      pendingList,
      recentCertificates,
      recentApplications,
      statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count._all })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;