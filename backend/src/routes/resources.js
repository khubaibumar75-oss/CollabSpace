const { Router } = require("express");
const prisma = require("../lib/prisma");
const { isLoggedIn } = require("../middleware/auth");
const { hasWorkspaceAccess } = require("../middleware/workspace");
const { validateBody, validateParams } = require("../middleware/validate");
const {
  createResourceSchema,
  workspaceIdParam,
  resourceIdParam,
} = require("../validators/schemas");

const router = Router();

router.use(isLoggedIn);

router.get(
  "/:workspaceId/resources",
  validateParams(workspaceIdParam),
  hasWorkspaceAccess(),
  async (req, res) => {
    const resources = await prisma.resource.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ resources });
  }
);

router.post(
  "/:workspaceId/resources",
  validateParams(workspaceIdParam),
  validateBody(createResourceSchema),
  hasWorkspaceAccess(),
  async (req, res) => {
    const resource = await prisma.resource.create({
      data: {
        workspaceId: req.params.workspaceId,
        userId: req.user.userId,
        title: req.body.title,
        url: req.body.url,
        tags: req.body.tags,
      },
      include: { user: { select: { id: true, email: true } } },
    });
    res.status(201).json(resource);
  }
);

router.delete(
  "/:workspaceId/resources/:resourceId",
  validateParams(resourceIdParam),
  hasWorkspaceAccess(),
  async (req, res) => {
    const resource = await prisma.resource.findUnique({
      where: { id: req.params.resourceId },
    });

    if (!resource || resource.workspaceId !== req.params.workspaceId) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.userId,
          workspaceId: req.params.workspaceId,
        },
      },
    });

    const isOwner = resource.userId === req.user.userId;
    const isAdmin = membership?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Cannot delete this resource" });
    }

    await prisma.resource.delete({ where: { id: req.params.resourceId } });
    res.json({ message: "Resource deleted" });
  }
);

module.exports = router;
