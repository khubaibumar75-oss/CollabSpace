const { Router } = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { validateBody } = require("../middleware/validate");
const { loginSchema, registerSchema } = require("../validators/schemas");
const {
  signAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} = require("../utils/tokens");
const { isLoggedIn } = require("../middleware/auth");
const { processPendingInvites } = require("../utils/invites");

const router = Router();

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post("/register", validateBody(registerSchema), async (req, res) => {
  const { email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  await processPendingInvites(user.id, email);

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = await createRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    accessToken,
    user: { id: user.id, email: user.email },
  });
});

router.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await processPendingInvites(user.id, email);

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = await createRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);

  res.json({
    accessToken,
    user: { id: user.id, email: user.email },
  });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ error: "No refresh token" });
  }

  const record = await verifyRefreshToken(token);
  if (!record) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const accessToken = signAccessToken({
    userId: record.user.id,
    email: record.user.email,
  });

  res.json({ accessToken });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await revokeRefreshToken(token);
  }
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Logged out" });
});

router.get("/me", isLoggedIn, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, email: true },
  });
  res.json({ user });
});

module.exports = router;