import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Encrypt sensitive data (like API keys)
 */
export function encrypt(text: string): string {
  if (!text) return "";

  const key = Buffer.from(env.ENCRYPTION_SECRET, "utf-8").subarray(0, 32);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted data + auth tag
  return iv.toString("hex") + ":" + encrypted + ":" + authTag.toString("hex");
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], "hex");

    const key = Buffer.from(env.ENCRYPTION_SECRET, "utf-8").subarray(0, 32);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return "";
  }
}

/**
 * Mask an API key for display (show only first/last few characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return "••••••••";
  return apiKey.substring(0, 4) + "••••••••" + apiKey.substring(apiKey.length - 4);
}

