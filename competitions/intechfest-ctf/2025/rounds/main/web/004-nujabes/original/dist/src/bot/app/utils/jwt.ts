import crypto from "crypto";
import { secret } from "../config";

function validateKey(key: Buffer): Buffer {
  const mask = Buffer.from("my-static-mask-32-bytes", "utf-8");
  return Buffer.from(key.map((b, i) => b ^ mask[i % mask.length]));
}

export async function generateJWT(data: object): Promise<string> {
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.from(JSON.stringify(data), "utf8");
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();
  const obfKey = validateKey(key);
  const token = Buffer.concat([iv, encrypted, tag, obfKey]);
  return token.toString("base64url");
}

export async function decodeJWT(token: string): Promise<object> {
  const buf = Buffer.from(token, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 48, buf.length - 32);
  const obfKey = buf.subarray(buf.length - 32);
  const ciphertext = buf.subarray(12, buf.length - 48);
  const key = validateKey(obfKey);
  const expectedKey = crypto.createHash("sha256").update(secret).digest();
  if (!key.equals(expectedKey)) {
    console.log("expected:", expectedKey.toString("hex"));
    console.log("got     :", key.toString("hex"));
    throw new Error("Invalid key");
  }
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}
