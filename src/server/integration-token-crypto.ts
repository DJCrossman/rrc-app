import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { envVars } from "@/lib/env";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_IV_LENGTH = 12;
const ENCRYPTION_KEY_LENGTH = 32;

let cachedEncryptionKey: Buffer | undefined;

function getEncryptionKey(): Buffer {
	if (cachedEncryptionKey) return cachedEncryptionKey;
	const raw = envVars.INTEGRATION_TOKEN_ENCRYPTION_KEY;
	if (!raw) {
		throw new Error(
			"INTEGRATION_TOKEN_ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32`.",
		);
	}
	const decoded = Buffer.from(raw, "base64");
	if (decoded.length !== ENCRYPTION_KEY_LENGTH) {
		throw new Error(
			`INTEGRATION_TOKEN_ENCRYPTION_KEY must decode to ${ENCRYPTION_KEY_LENGTH} bytes (got ${decoded.length}). Generate one with \`openssl rand -base64 32\`.`,
		);
	}
	cachedEncryptionKey = decoded;
	return decoded;
}

export function encryptToken(plaintext: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(ENCRYPTION_IV_LENGTH);
	const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return [
		iv.toString("base64"),
		tag.toString("base64"),
		ciphertext.toString("base64"),
	].join(":");
}

export function decryptToken(payload: string): string {
	const key = getEncryptionKey();
	const parts = payload.split(":");
	if (parts.length !== 3) {
		throw new Error("Invalid encrypted token payload");
	}
	const [ivB64, tagB64, ctB64] = parts;
	const iv = Buffer.from(ivB64, "base64");
	const tag = Buffer.from(tagB64, "base64");
	const ciphertext = Buffer.from(ctB64, "base64");
	const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
	decipher.setAuthTag(tag);
	const plaintext = Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	]);
	return plaintext.toString("utf8");
}
