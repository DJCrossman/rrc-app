import { randomBytes } from "node:crypto";

export function generateCalendarToken(): string {
	return randomBytes(24).toString("base64url");
}
