import { PrismaClient } from "../../prisma/generated/panel";

declare global {
  var prismaPanel: PrismaClient | undefined;
}

export const prismaPanel =
  global.prismaPanel ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prismaPanel = prismaPanel;
}
