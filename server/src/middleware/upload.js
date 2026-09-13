import multer from "multer";
import crypto from "crypto";
import path from "path";

const UPLOAD_DIR = path.resolve("uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const name = `${Date.now()}-${crypto.randomInt(100000, 999999)}${path.extname(file.originalname)}`;
    cb(null, name);
  },
});

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});
