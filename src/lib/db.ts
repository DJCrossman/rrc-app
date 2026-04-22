import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { envVars } from "./env";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const db =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter: new PrismaNeon({
			connectionString: envVars.DATABASE_URL,
		}),
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
}
