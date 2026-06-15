const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const createResourceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  tags: z.array(z.string()).default([]),
});

const workspaceIdParam = z.object({
  workspaceId: z.string().uuid(),
});

const resourceIdParam = z.object({
  workspaceId: z.string().uuid(),
  resourceId: z.string().uuid(),
});

const memberIdParam = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  createResourceSchema,
  workspaceIdParam,
  resourceIdParam,
  memberIdParam,
};
