// ─────────────────────────────────────────────────────────────────────────────
// Primitivas criptográficas usadas pela sessão segura.
//
// expo-crypto não implementa AES-GCM nem HMAC de verdade (só digest/hash e
// bytes aleatórios), e o motor do React Native (Hermes) não expõe
// `crypto.subtle` fora da web. Por isso, o hash/HMAC/AES real vem de
// @noble/hashes e @noble/ciphers — bibliotecas puramente em JS, sem código
// nativo, que funcionam igual no Expo Go, no bare workflow e na web.
// expo-crypto fica só como fonte de entropia (CSPRNG).
// ─────────────────────────────────────────────────────────────────────────────
import * as ExpoCrypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

export type HexString = string;

export async function randomBytes(length: number): Promise<Uint8Array> {
  return ExpoCrypto.getRandomBytesAsync(length);
}

export async function randomHex(length: number): Promise<HexString> {
  return bytesToHex(await randomBytes(length));
}

export function toHex(bytes: Uint8Array): HexString {
  return bytesToHex(bytes);
}

export function fromHex(hex: HexString): Uint8Array {
  return hexToBytes(hex);
}

export function sha256Hex(input: string): HexString {
  return bytesToHex(sha256(utf8ToBytes(input)));
}

export function hmacSha256Hex(keyHex: HexString, message: string): HexString {
  return bytesToHex(hmac(sha256, hexToBytes(keyHex), utf8ToBytes(message)));
}

/** Comparação em tempo constante, para evitar timing attacks ao validar assinaturas/MACs. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export interface SealedEnvelope {
  v: 1;
  alg: 'AES-256-GCM';
  iv: HexString;
  data: HexString;
}

export function isSealedEnvelope(value: unknown): value is SealedEnvelope {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).alg === 'AES-256-GCM' &&
    typeof (value as Record<string, unknown>).iv === 'string' &&
    typeof (value as Record<string, unknown>).data === 'string'
  );
}

/** Cifra um valor qualquer (serializado em JSON) com AES-256-GCM. */
export async function encryptJson(
  keyHex: HexString,
  value: unknown
): Promise<SealedEnvelope> {
  const key = hexToBytes(keyHex);
  const iv = await randomBytes(12);
  const plaintext = utf8ToBytes(JSON.stringify(value));
  const ciphertext = gcm(key, iv).encrypt(plaintext);
  return { v: 1, alg: 'AES-256-GCM', iv: bytesToHex(iv), data: bytesToHex(ciphertext) };
}

/**
 * Abre um envelope AES-256-GCM. Lança erro se a tag de autenticação não
 * validar (conteúdo adulterado) — quem chama deve tratar isso como falha,
 * nunca usar um payload parcialmente decodificado.
 */
export function decryptJson<T = unknown>(keyHex: HexString, envelope: SealedEnvelope): T {
  const key = hexToBytes(keyHex);
  const iv = hexToBytes(envelope.iv);
  const plaintext = gcm(key, iv).decrypt(hexToBytes(envelope.data));
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}
