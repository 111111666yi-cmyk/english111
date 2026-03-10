"use client";

const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function derivePasswordBytes(password: string, salt: Uint8Array) {
  const normalizedSalt = Uint8Array.from(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: normalizedSalt,
      iterations: 120_000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return new Uint8Array(bits);
}

export async function createPasswordHash(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordBytes(password, salt);

  return {
    salt: bytesToBase64(salt),
    hash: bytesToBase64(hash)
  };
}

export async function verifyPasswordHash(password: string, record: { salt: string; hash: string }) {
  const salt = base64ToBytes(record.salt);
  const expected = base64ToBytes(record.hash);
  const actual = await derivePasswordBytes(password, salt);

  if (expected.length !== actual.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected[index] ^ actual[index];
  }

  return mismatch === 0;
}
