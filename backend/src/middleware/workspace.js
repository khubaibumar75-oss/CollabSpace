const prisma = require("../lib/prisma");

function hasWorkspaceAccess(requireAdmin = false) {
  return async (req, res, next) => {
    const workspaceId = req.params.workspaceId;
    const userId = req.user.userId;

    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      return res.status(403).json({ error: "No access to this workspace" });
    }

    if (requireAdmin && membership.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.membership = membership;
    next();
  };
}

module.exports = { hasWorkspaceAccess };
