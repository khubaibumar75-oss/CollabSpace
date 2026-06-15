const { Router } = require("express");
const prisma = require("../lib/prisma");
const { isLoggedIn } = require("../middleware/auth");
const { hasWorkspaceAccess } = require("../middleware/workspace");
const { validateBody, validateParams } = require("../middleware/validate");
const {
  createWorkspaceSchema,
  inviteMemberSchema,
  workspaceIdParam,
  memberIdParam,
} = require("../validators/schemas");
const { slugify } = require("../utils/slugify");

const router = Router();

router.use(isLoggedIn);

router.get("/", async (req, res) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.user.userId },
    include: { workspace: true },
  });

  res.json({
    workspaces: memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    })),
  });
});

router.post("/", validateBody(createWorkspaceSchema), async (req, res) => {
  const { name } = req.body;
  let slug = slugify(name);

  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: { userId: req.user.userId, role: "ADMIN" },
      },
    },
  });

  res.status(201).json(workspace);
});

router.get(
  "/:workspaceId",
  validateParams(workspaceIdParam),
  hasWorkspaceAccess(),
  async (req, res) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.workspaceId },
      include: {
        members: { include: { user: { select: { id: true, email: true } } } },
      },
    });
    res.json(workspace);
  }
);

router.get(
  "/:workspaceId/members",
  validateParams(workspaceIdParam),
  hasWorkspaceAccess(),
  async (req, res) => {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: { user: { select: { id: true, email: true } } },
    });

    res.json({
      members: members.map((m) => ({
        userId: m.user.id,
        email: m.user.email,
        role: m.role,
      })),
    });
  }
);

router.post(
  "/:workspaceId/invite",
  validateParams(workspaceIdParam),
  validateBody(inviteMemberSchema),
  hasWorkspaceAccess(true),
  async (req, res) => {
    const { email, role } = req.body;
    const workspaceId = req.params.workspaceId;

    const invitedUser = await prisma.user.findUnique({ where: { email } });

    if (invitedUser) {
      const existing = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId: invitedUser.id, workspaceId },
        },
      });
      if (existing) {
        return res.status(409).json({ error: "User already a member" });
      }

      await prisma.workspaceMember.create({
        data: { userId: invitedUser.id, workspaceId, role },
      });

      return res.json({ message: "User added to workspace", status: "joined" });
    }

    await prisma.workspaceInvite.upsert({
      where: { email_workspaceId: { email, workspaceId } },
      create: { email, workspaceId, role, invitedById: req.user.userId },
      update: { role },
    });

    res.json({ message: "Invite saved for when user registers", status: "pending" });
  }
);

router.delete(
  "/:workspaceId/members/:userId",
  validateParams(memberIdParam),
  hasWorkspaceAccess(true),
  async (req, res) => {
    const { workspaceId, userId } = req.params;

    if (userId === req.user.userId) {
      return res.status(400).json({ error: "Cannot remove yourself" });
    }

    await prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    res.json({ message: "Member removed" });
  }
);

router.get(
  "/:workspaceId/tags",
  validateParams(workspaceIdParam),
  hasWorkspaceAccess(),
  async (req, res) => {
    const resources = await prisma.resource.findMany({
      where: { workspaceId: req.params.workspaceId },
      select: { tags: true },
    });

    const tagSet = new Set();
    resources.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));

    res.json({ tags: Array.from(tagSet).sort() });
  }
);

module.exports = router;
