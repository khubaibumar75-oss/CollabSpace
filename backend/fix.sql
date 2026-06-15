INSERT INTO "WorkspaceMember" ("userId", "workspaceId", "role", "createdAt")
VALUES ('ef79e13f-5e70-4f9f-a5cc-3742886bd189', '55566b45-e2f4-4de6-99f7-b7d3a3e137b7', 'ADMIN', NOW())
ON CONFLICT ("userId", "workspaceId") DO UPDATE SET "role" = 'ADMIN';
