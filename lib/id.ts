// URL-safe, unambiguous alphabet (no 0/O/1/l/I).
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

function randomId(len: number): string {
  let out = "";
  const bytes =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint8Array(len))
      : null;
  for (let i = 0; i < len; i++) {
    const n = bytes ? bytes[i] : Math.floor(Math.random() * 256);
    out += ALPHABET[n % ALPHABET.length];
  }
  return out;
}

/** Short, friendly, shareable event slug. */
export function newSlug(): string {
  return randomId(8);
}

/** Per-participant id, stored client-side so people can edit their own answer. */
export function newPid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return randomId(16);
}
