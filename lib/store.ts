import { Redis } from "@upstash/redis";
import type { EventMeta, EventState, Participant } from "./types";

/**
 * Storage abstraction.
 *
 * Production: any Redis with an HTTP interface — works transparently with
 * Vercel KV (KV_REST_API_URL / KV_REST_API_TOKEN) or standalone Upstash
 * (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
 *
 * Dev / no creds: an in-process map so the whole app runs and can be verified
 * end-to-end without any cloud setup.
 *
 * Writes are per-participant (Redis hash fields), so two friends submitting at
 * the same time never clobber each other.
 */

const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

const ev = (slug: string) => `fecha:e:${slug}`;
const pr = (slug: string) => `fecha:p:${slug}`;

interface Store {
  createEvent(meta: EventMeta): Promise<void>;
  getMeta(slug: string): Promise<EventMeta | null>;
  getEvent(slug: string): Promise<EventState | null>;
  upsertParticipant(slug: string, p: Participant): Promise<void>;
}

// ---------------- Redis-backed ----------------

function getRedisCreds(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url, token };
  return null;
}

function makeRedisStore(creds: { url: string; token: string }): Store {
  const redis = new Redis({ url: creds.url, token: creds.token });
  return {
    async createEvent(meta) {
      await redis.set(ev(meta.slug), JSON.stringify(meta), { ex: TTL_SECONDS });
    },
    async getMeta(slug) {
      const raw = await redis.get<string | EventMeta>(ev(slug));
      return parseMeta(raw);
    },
    async getEvent(slug) {
      const [rawMeta, parts] = await Promise.all([
        redis.get<string | EventMeta>(ev(slug)),
        redis.hgetall<Record<string, string | Participant>>(pr(slug)),
      ]);
      const meta = parseMeta(rawMeta);
      if (!meta) return null;
      const participants = Object.values(parts ?? {})
        .map(parseParticipant)
        .filter((p): p is Participant => !!p)
        .sort((a, b) => a.updatedAt - b.updatedAt);
      return { meta, participants };
    },
    async upsertParticipant(slug, p) {
      await redis.hset(pr(slug), { [p.pid]: JSON.stringify(p) });
      await redis.expire(pr(slug), TTL_SECONDS);
      await redis.expire(ev(slug), TTL_SECONDS);
    },
  };
}

function parseMeta(raw: unknown): EventMeta | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as EventMeta;
    } catch {
      return null;
    }
  }
  return raw as EventMeta;
}

function parseParticipant(raw: unknown): Participant | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Participant;
    } catch {
      return null;
    }
  }
  return raw as Participant;
}

// ---------------- In-memory (dev fallback) ----------------

interface MemEvent {
  meta: EventMeta;
  parts: Map<string, Participant>;
}

function makeMemoryStore(): Store {
  const g = globalThis as unknown as { __fechaMem?: Map<string, MemEvent> };
  const db = (g.__fechaMem ??= new Map<string, MemEvent>());
  return {
    async createEvent(meta) {
      db.set(meta.slug, { meta, parts: new Map() });
    },
    async getMeta(slug) {
      return db.get(slug)?.meta ?? null;
    },
    async getEvent(slug) {
      const e = db.get(slug);
      if (!e) return null;
      const participants = [...e.parts.values()].sort(
        (a, b) => a.updatedAt - b.updatedAt,
      );
      return { meta: e.meta, participants };
    },
    async upsertParticipant(slug, p) {
      const e = db.get(slug);
      if (!e) return;
      e.parts.set(p.pid, p);
    },
  };
}

// ---------------- Singleton ----------------

let _store: Store | null = null;

export function store(): Store {
  if (_store) return _store;
  const creds = getRedisCreds();
  _store = creds ? makeRedisStore(creds) : makeMemoryStore();
  return _store;
}

export function storageMode(): "redis" | "memory" {
  return getRedisCreds() ? "redis" : "memory";
}
