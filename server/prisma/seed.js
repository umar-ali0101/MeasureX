import "dotenv/config";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";
import { newApplicationNo, newCertificateNo, sha256, addYears } from "../src/lib/helpers.js";

const prisma = new PrismaClient();

const hash = async (p) => await bcrypt.hash(p, 10);

async function seed() {
  console.log("Seeding database...");
  await prisma.alert.deleteMany();
  await prisma.document.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.application.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "State Administrator",
      email: "admin@lm.gov.in",
      passwordHash: await hash("admin123"),
      role: "ADMIN",
      phone: "9812345670",
      state: "Maharashtra",
      district: "Mumbai",
    },
  });

  const lmo = await prisma.user.create({
    data: {
      name: "Anil Sharma",
      email: "lmo@lm.gov.in",
      passwordHash: await hash("lmo123"),
      role: "LMO",
      phone: "9812345671",
      orgName: "State Legal Metrology Department",
      state: "Maharashtra",
      district: "Pune",
    },
  });

  const gatc = await prisma.user.create({
    data: {
      name: "Meera Nair",
      email: "gatc@lm.gov.in",
      passwordHash: await hash("gatc123"),
      role: "GATC",
      phone: "9812345672",
      orgName: "NDM Test Centre Pvt Ltd",
      state: "Maharashtra",
      district: "Nashik",
    },
  });

  const business = await prisma.user.create({
    data: {
      name: "Ramesh Gupta",
      email: "business@example.com",
      passwordHash: await hash("business123"),
      role: "BUSINESS",
      phone: "9812345673",
      orgName: "Gupta Traders & Mills",
      gstin: "GST27ABCDE1234F1Z5",
      address: "Plot 12, MIDC Industrial Area",
      state: "Maharashtra",
      district: "Pune",
      pincode: "411038",
    },
  });

  const business2 = await prisma.user.create({
    data: {
      name: "Suresh Patil",
      email: "patil@example.com",
      passwordHash: await hash("business123"),
      role: "BUSINESS",
      phone: "9812345674",
      orgName: "Patil Fuel Station",
      gstin: "GST27PQRST1234F1Z5",
      state: "Maharashtra",
      district: "Nashik",
    },
  });

  // ---- Instruments ----
  const eq1 = await prisma.instrument.create({
    data: {
      ownerId: business.id,
      name: "Electronic Weighing Scale",
      category: "Weighing",
      make: "Essae",
      model: "FS-300",
      serialNo: "ES-2023-0145",
      capacity: "300 kg",
      leastCount: "0.1 kg",
      accuracyClass: "III",
      stampingYear: 2025,
      location: "Unit 1, MIDC Pune",
      state: "Maharashtra",
      district: "Pune",
      status: "VERIFIED",
    },
  });

  const eq2 = await prisma.instrument.create({
    data: {
      ownerId: business.id,
      name: "Fuel Dispensing Unit",
      category: "Volume",
      make: "Gilbarco",
      model: "GD-2",
      serialNo: "GB-2024-7781",
      capacity: "80 L/min",
      leastCount: "0.01 L",
      accuracyClass: "III",
      location: "Pune Highway Outlet",
      state: "Maharashtra",
      district: "Pune",
      status: "REGISTERED",
    },
  });

  const eq3 = await prisma.instrument.create({
    data: {
      ownerId: business2.id,
      name: "Weighbridge",
      category: "Weighing",
      make: "EIL",
      model: "WB-60T",
      serialNo: "EIL-2021-0032",
      capacity: "60 t",
      leastCount: "20 kg",
      accuracyClass: "III",
      stampingYear: 2024,
      location: "Patil Fuel Station, Nashik",
      state: "Maharashtra",
      district: "Nashik",
      status: "VERIFIED",
    },
  });

  const eq4 = await prisma.instrument.create({
    data: {
      ownerId: business2.id,
      name: "Petrol Dispensing Unit",
      category: "Volume",
      make: "Wayne",
      model: "Ovation2",
      serialNo: "WN-2019-1120",
      capacity: "75 L/min",
      leastCount: "0.01 L",
      accuracyClass: "III",
      stampingYear: 2023,
      location: "Patil Fuel Station, Nashik",
      state: "Maharashtra",
      district: "Nashik",
      status: "EXPIRED",
    },
  });

  // ---- Applications ----
  const app1 = await prisma.application.create({
    data: {
      applicationNo: newApplicationNo(),
      instrumentId: eq2.id,
      applicantId: business.id,
      type: "NEW",
      status: "SCHEDULED",
      preferredDate: new Date(),
      scheduledDate: new Date(Date.now() + 3 * 86400000),
      assignedToId: lmo.id,
      assignedToType: "LMO",
      feeAmount: 1200,
      paymentStatus: "PAID",
    },
  });

  const app2 = await prisma.application.create({
    data: {
      applicationNo: newApplicationNo(),
      instrumentId: eq4.id,
      applicantId: business2.id,
      type: "REVERIFICATION",
      status: "SUBMITTED",
      preferredDate: new Date(Date.now() + 10 * 86400000),
      feeAmount: 800,
      paymentStatus: "PENDING",
    },
  });

  const app3 = await prisma.application.create({
    data: {
      applicationNo: newApplicationNo(),
      instrumentId: eq3.id,
      applicantId: business2.id,
      type: "REVERIFICATION",
      status: "SCHEDULED",
      scheduledDate: new Date(Date.now() + 2 * 86400000),
      assignedToId: gatc.id,
      assignedToType: "GATC",
      feeAmount: 5000,
      paymentStatus: "PAID",
    },
  });

  // ---- Verified history for eq1 and eq3 ----
  const completed1 = await prisma.application.create({
    data: {
      applicationNo: newApplicationNo(),
      instrumentId: eq1.id,
      applicantId: business.id,
      type: "NEW",
      status: "VERIFIED",
      assignedToId: lmo.id,
      assignedToType: "LMO",
      feeAmount: 1200,
      paymentStatus: "PAID",
    },
  });

  const validFromEq1 = new Date("2025-02-15");
  const validUntilEq1 = addYears(validFromEq1, 1);
  const certNoEq1 = newCertificateNo();
  const qrEq1 = await QRCode.toDataURL(`${process.env.PUBLIC_URL || "http://localhost:4000"}/api/certificates/verify/${certNoEq1}`, { width: 320, margin: 1 });

  const v1 = await prisma.verification.create({
    data: {
      applicationId: completed1.id,
      instrumentId: eq1.id,
      officerId: lmo.id,
      observations: "Visual inspection and load test passed. Seals intact.",
      result: "PASS",
      verifiedAt: validFromEq1,
      nextDueDate: validUntilEq1,
    },
  });
  await prisma.certificate.create({
    data: {
      certificateNo: certNoEq1,
      verificationId: v1.id,
      validFrom: validFromEq1,
      validUntil: validUntilEq1,
      qrData: qrEq1,
      verificationHash: sha256(`${certNoEq1}|${eq1.id}|${validFromEq1.toISOString()}|${validUntilEq1.toISOString()}`),
      status: "VALID",
    },
  });

  // eq3 verified with a nearly-expiring certificate (for expiry alerts demo)
  const validFromEq3 = new Date("2025-11-20");
  const validUntilEq3 = addYears(validFromEq3, 1);
  const certNoEq3 = newCertificateNo();
  const qrEq3 = await QRCode.toDataURL(`${process.env.PUBLIC_URL || "http://localhost:4000"}/api/certificates/verify/${certNoEq3}`, { width: 320, margin: 1 });

  const completed3 = await prisma.application.create({
    data: {
      applicationNo: newApplicationNo(),
      instrumentId: eq3.id,
      applicantId: business2.id,
      type: "REVERIFICATION",
      status: "VERIFIED",
      assignedToId: gatc.id,
      assignedToType: "GATC",
      feeAmount: 5000,
      paymentStatus: "PAID",
    },
  });

  const v3 = await prisma.verification.create({
    data: {
      applicationId: completed3.id,
      instrumentId: eq3.id,
      officerId: gatc.id,
      observations: "All checks satisfactory.",
      result: "PASS",
      verifiedAt: validFromEq3,
      nextDueDate: validUntilEq3,
    },
  });
  await prisma.certificate.create({
    data: {
      certificateNo: certNoEq3,
      verificationId: v3.id,
      validFrom: validFromEq3,
      validUntil: validUntilEq3,
      qrData: qrEq3,
      verificationHash: sha256(`${certNoEq3}|${eq3.id}|${validFromEq3.toISOString()}|${validUntilEq3.toISOString()}`),
      status: "VALID",
    },
  });

  // ---- Alerts ----
  const dueDate = new Date(validUntilEq3);
  dueDate.setDate(dueDate.getDate() - 30);
  await prisma.alert.createMany({
    data: [
      {
        userId: business2.id,
        instrumentId: eq3.id,
        type: "DUE",
        title: "Re-verification due soon",
        message: `${eq3.name} (${eq3.serialNo}) verification expires on ${validUntilEq3.toISOString().slice(0, 10)}. Please apply for re-verification.`,
        dueDate,
      },
      {
        userId: business.id,
        instrumentId: eq2.id,
        type: "APPLICATION",
        title: "Verification scheduled",
        message: `Application ${app1.applicationNo} for ${eq2.name} is scheduled with Anil Sharma (LMO).`,
      },
    ],
  });

  // eq4 expired -> alert for business2
  await prisma.alert.create({
    data: {
      userId: business2.id,
      instrumentId: eq4.id,
      type: "EXPIRY",
      title: "Verification expired",
      message: `${eq4.name} (${eq4.serialNo}) verification has expired. Renewal required before next use.`,
    },
  });

  console.log("Seeding complete.");
  console.log({
    admin: { email: "admin@lm.gov.in", password: "admin123" },
    lmo: { email: "lmo@lm.gov.in", password: "lmo123" },
    gatc: { email: "gatc@lm.gov.in", password: "gatc123" },
    business: { email: "business@example.com", password: "business123" },
  });
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });