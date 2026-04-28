import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __stockflixPool: mysql.Pool | undefined;
}

function buildPool(): mysql.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Provision TiDB Cloud Serverless via the Vercel Marketplace.",
    );
  }
  return mysql.createPool({
    uri: url,
    connectionLimit: 10,
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: true, minVersion: "TLSv1.2" }
        : undefined,
    namedPlaceholders: true,
    decimalNumbers: true,
  });
}

export function getPool(): mysql.Pool {
  if (globalThis.__stockflixPool) return globalThis.__stockflixPool;
  const created = buildPool();
  if (process.env.NODE_ENV !== "production") {
    globalThis.__stockflixPool = created;
  }
  return created;
}

// Back-compat: lazy proxy so existing `import { pool }` call sites still work,
// but the underlying pool is only constructed on first property access.
export const pool: mysql.Pool = new Proxy({} as mysql.Pool, {
  get(_target, prop, receiver) {
    const real = getPool();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export type SqlParam = string | number | boolean | Date | null | Buffer;

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: readonly SqlParam[] = [],
): Promise<T[]> {
  // Use query() (text protocol) instead of execute() (binary) so LIMIT/OFFSET
  // placeholders bind correctly under MySQL 8 prepared-statement constraints.
  // ?-placeholders are still escaped safely by mysql2's formatter.
  const [rows] = await getPool().query(sql, params as SqlParam[]);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: readonly SqlParam[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export type WriteResult = {
  insertId: number;
  affectedRows: number;
  changedRows?: number;
};

export async function execute(
  sql: string,
  params: readonly SqlParam[] = [],
): Promise<WriteResult> {
  const [result] = await getPool().query(sql, params as SqlParam[]);
  return result as unknown as WriteResult;
}

export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
