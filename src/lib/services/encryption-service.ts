import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { env } from "@/src/env";

/**
 * Encryption service for secure cookie and sensitive data storage
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Derive encryption key from secret
 * Uses SHA-256 to ensure consistent key length
 */
function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypt data using AES-256-GCM
 * @param plaintext - Data to encrypt
 * @returns Encrypted data with IV and auth tag (format: iv:authTag:encrypted)
 */
export function encrypt(plaintext: string): string {
  try {
    const key = deriveKey(env.ENCRYPTION_SECRET);
    const iv = randomBytes(IV_LENGTH);
    
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param ciphertext - Encrypted data (format: iv:authTag:encrypted)
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  try {
    const key = deriveKey(env.ENCRYPTION_SECRET);
    
    // Parse the encrypted data
    const parts = ciphertext.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Hash data using SHA-256
 * Useful for creating non-reversible hashes
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export function hash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Generate a secure random secret
 * @param length - Length in bytes (default: 32)
 * @returns Hex-encoded random string
 */
export function generateSecret(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Verify if encrypted data can be decrypted
 * @param ciphertext - Encrypted data to verify
 * @returns True if data can be decrypted
 */
export function verifyEncrypted(ciphertext: string): boolean {
  try {
    decrypt(ciphertext);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypt object as JSON
 * @param obj - Object to encrypt
 * @returns Encrypted JSON string
 */
export function encryptObject<T>(obj: T): string {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt JSON object
 * @param ciphertext - Encrypted JSON string
 * @returns Decrypted object
 */
export function decryptObject<T>(ciphertext: string): T {
  const decrypted = decrypt(ciphertext);
  return JSON.parse(decrypted) as T;
}

