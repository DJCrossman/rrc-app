import { defineConfig } from "prisma/config";
import { envVars } from "@/lib/env";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: envVars.DATABASE_URL,
	},
});
