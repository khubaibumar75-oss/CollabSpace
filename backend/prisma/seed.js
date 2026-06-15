const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  await prisma.refreshToken.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.workspaceInvite.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      passwordHash,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: "charlie@example.com",
      passwordHash,
    },
  });

  const designTeam = await prisma.workspace.create({
    data: {
      name: "Design Team",
      slug: "design-team",
      members: {
        create: [
          { userId: alice.id, role: "ADMIN" },
          { userId: bob.id, role: "MEMBER" },
        ],
      },
      resources: {
        create: [
          {
            title: "Figma Design System",
            url: "https://figma.com",
            tags: ["design", "ui"],
            userId: alice.id,
          },
          {
            title: "Color Palette Guide",
            url: "https://coolors.co",
            tags: ["design", "colors"],
            userId: bob.id,
          },
        ],
      },
    },
  });

  const engineering = await prisma.workspace.create({
    data: {
      name: "Engineering",
      slug: "engineering",
      members: {
        create: [
          { userId: bob.id, role: "ADMIN" },
          { userId: charlie.id, role: "MEMBER" },
        ],
      },
      resources: {
        create: [
          {
            title: "Node.js Docs",
            url: "https://nodejs.org/docs",
            tags: ["backend", "docs"],
            userId: bob.id,
          },
          {
            title: "React Docs",
            url: "https://react.dev",
            tags: ["frontend", "docs"],
            userId: charlie.id,
          },
        ],
      },
    },
  });

  console.log("Seed complete!");
  console.log({ alice: alice.email, bob: bob.email, charlie: charlie.email });
  console.log({ workspaces: [designTeam.name, engineering.name] });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
