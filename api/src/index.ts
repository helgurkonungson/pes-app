/**
 * Cloudflare Worker entry for api.chompbook.online (ADR-037). Storage: D1 (binding DB);
 * tables are created on first use, so a fresh database needs no manual SQL.
 */
import { cleanup, handle, type Env, type Store } from "./logic";

interface D1Result<T> {
  results?: T[];
}
interface D1Stmt {
  bind(...v: unknown[]): D1Stmt;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T>(): Promise<D1Result<T>>;
}
interface D1Database {
  prepare(sql: string): D1Stmt;
  exec(sql: string): Promise<unknown>;
}

interface WorkerEnv extends Env {
  DB: D1Database;
}

// D1 exec() runs one statement per line
const SCHEMA = `
CREATE TABLE IF NOT EXISTS entitlements (user_id TEXT PRIMARY KEY, active INTEGER NOT NULL, checked_at INTEGER NOT NULL, expires_at INTEGER);
CREATE TABLE IF NOT EXISTS usage (user_id TEXT NOT NULL, day TEXT NOT NULL, tokens INTEGER NOT NULL DEFAULT 0, requests INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day));
`;

let schemaReady: Promise<unknown> | null = null;

function d1Store(db: D1Database): Store {
  return {
    async getEntitlement(user) {
      const r = await db.prepare("SELECT active, checked_at, expires_at FROM entitlements WHERE user_id = ?").bind(user).first<{ active: number; checked_at: number; expires_at: number | null }>();
      return r ? { active: r.active === 1, checkedAt: r.checked_at, expiresAt: r.expires_at } : null;
    },
    async putEntitlement(user, active, checkedAt, expiresAt) {
      await db
        .prepare("INSERT INTO entitlements (user_id, active, checked_at, expires_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET active = excluded.active, checked_at = excluded.checked_at, expires_at = excluded.expires_at")
        .bind(user, active ? 1 : 0, checkedAt, expiresAt)
        .run();
    },
    async getUsage(user, day) {
      const r = await db.prepare("SELECT tokens FROM usage WHERE user_id = ? AND day = ?").bind(user, day).first<{ tokens: number }>();
      return r?.tokens ?? 0;
    },
    async addUsage(user, day, tokens) {
      await db
        .prepare("INSERT INTO usage (user_id, day, tokens, requests) VALUES (?, ?, ?, 1) ON CONFLICT(user_id, day) DO UPDATE SET tokens = tokens + excluded.tokens, requests = requests + 1")
        .bind(user, day, tokens)
        .run();
    },
    async cleanup(beforeDay, checkedBefore) {
      await db.prepare("DELETE FROM usage WHERE day < ?").bind(beforeDay).run();
      await db.prepare("DELETE FROM entitlements WHERE checked_at < ?").bind(checkedBefore).run();
    },
  };
}

function ensureSchema(db: D1Database): Promise<unknown> {
  schemaReady ??= db.exec(SCHEMA.trim()).catch((e) => {
    schemaReady = null;
    throw e;
  });
  return schemaReady;
}

export default {
  async fetch(req: Request, env: WorkerEnv): Promise<Response> {
    await ensureSchema(env.DB);
    return handle(req, env, { fetch: (input, init) => fetch(input, init), now: () => Date.now(), store: d1Store(env.DB) });
  },
  /** Cron trigger (wrangler.jsonc "triggers"): daily data-retention clean-up. */
  async scheduled(_event: unknown, env: WorkerEnv): Promise<void> {
    await ensureSchema(env.DB);
    await cleanup({ now: () => Date.now(), store: d1Store(env.DB) });
  },
};
