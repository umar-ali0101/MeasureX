import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

export const publicUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};
