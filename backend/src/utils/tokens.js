const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY_DAYS = 7;

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

async function verifyRefreshToken(token) {
  const record = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}

async function revokeRefreshToken(token) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

module.exports = {
  signAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
};
