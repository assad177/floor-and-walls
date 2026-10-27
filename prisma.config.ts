import { defineConfig } from "prisma/config";
import path from "path";

export default defineConfig({
  schema: path.join(import.meta.dirname, "prisma/schema.prisma"),
  datasource: {
    url: (process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mydb") + "?schema=fw_admin",
  },
});
