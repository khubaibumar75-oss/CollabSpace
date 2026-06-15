const prisma = require("../lib/prisma");

async function processPendingInvites(userId, email) {
  const invites = await prisma.workspaceInvite.findMany({ where: { email } });

  for (const invite of invites) {
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: invite.workspaceId },
      },
    });

    if (!existing) {
      await prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      });
    }

    await prisma.workspaceInvite.delete({ where: { id: invite.id } });
  }
}

module.exports = { processPendingInvites };
