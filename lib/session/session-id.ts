import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export function createSessionToken(id: string, secret: string) { return `${id}.${createHmac("sha256", secret).update(id).digest("base64url")}`; }
export function verifySessionToken(token: string, secret: string) { const split = token.lastIndexOf("."); if (split < 1) return null; const id = token.slice(0, split); const actual = Buffer.from(token.slice(split + 1)); const expected = Buffer.from(createHmac("sha256", secret).update(id).digest("base64url")); return actual.length === expected.length && timingSafeEqual(actual, expected) ? id : null; }
export function newSessionToken(secret: string) { return createSessionToken(randomUUID(), secret); }
