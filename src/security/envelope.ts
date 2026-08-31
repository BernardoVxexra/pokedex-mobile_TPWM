
import { randomHex, sha256Hex, hmacSha256Hex, isSealedEnvelope, decryptJson } from './crypto';

export interface SignedHeaders {
  'X-Poke-Timestamp': string;
  'X-Poke-Nonce': string;
  'X-Poke-Signature': string;
}

/**
 * Assina `${method}\n${path}\n${timestamp}\n${nonce}\n${sha256(body)}` com a
 * chave da sessão (ou de dispositivo, antes de haver sessão). O servidor de
 * referência valida essa assinatura e recusa nonce repetido; o backend atual
 * apenas recebe os cabeçalhos e os ignora.
 */
export async function signRequest(
  method: string,
  path: string,
  body: string | undefined,
  keyHex: string
): Promise<SignedHeaders> {
  const timestamp = String(Date.now());
  const nonce = await randomHex(16);
  const bodyHash = sha256Hex(body ?? '');
  const base = [method.toUpperCase(), path, timestamp, nonce, bodyHash].join('\n');
  const signature = hmacSha256Hex(keyHex, base);

  return {
    'X-Poke-Timestamp': timestamp,
    'X-Poke-Nonce': nonce,
    'X-Poke-Signature': signature,
  };
}

/**
 * Se o corpo da resposta for um envelope AES-256-GCM e tivermos a chave do
 * canal seguro negociada no login, abre e devolve o JSON de verdade. Caso
 * contrário, devolve o corpo como veio — passthrough total para backends que
 * não usam o protocolo.
 */
export function openEnvelopeIfPresent<T = unknown>(body: unknown, channelKeyHex: string | null): T {
  if (channelKeyHex && isSealedEnvelope(body)) {
    return decryptJson<T>(channelKeyHex, body);
  }
  return body as T;
}
