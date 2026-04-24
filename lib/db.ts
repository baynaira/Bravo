import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { hashPassword } from "@/lib/auth";
import type {
  InvestorRecord,
  SessionUser,
  UserRole,
  WithdrawalRecord
} from "@/lib/types";

type DbUserRow = {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  amount: number;
  projected_return: number;
  pending_amount: number;
  disbursed_amount: number;
  account_manager: string;
  tier: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type DbWithdrawalRow = {
  id: number;
  investor_id: number;
  method: string;
  destination: string;
  amount: number;
  status: string;
  created_at: string;
};

const DATABASE_URL = process.env.DATABASE_URL?.trim();
const usePostgres =
  Boolean(DATABASE_URL) &&
  (process.env.NODE_ENV === "production" ||
    process.env.USE_REMOTE_DB === "true");

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "investment.db");

let sqliteDb: InstanceType<typeof Database> | null = null;
let pgPool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function nowIso() {
  return new Date().toISOString();
}

function mapInvestorRow(row: Record<string, unknown>): InvestorRecord {
  return {
    id: Number(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    amount: Number(row.amount),
    projectedReturn: Number(row.projected_return),
    pendingAmount: Number(row.pending_amount),
    disbursedAmount: Number(row.disbursed_amount),
    accountManager: String(row.account_manager),
    tier: String(row.tier),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapSessionInvestor(row: DbUserRow) {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    email: row.email,
    amount: row.amount,
    projectedReturn: row.projected_return,
    pendingAmount: row.pending_amount,
    disbursedAmount: row.disbursed_amount,
    accountManager: row.account_manager,
    tier: row.tier,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapWithdrawalRow(row: Record<string, unknown>): WithdrawalRecord {
  return {
    id: Number(row.id),
    investorId: Number(row.investor_id),
    method: String(row.method),
    destination: String(row.destination),
    amount: Number(row.amount),
    status: String(row.status),
    createdAt: String(row.created_at)
  };
}

function getSqliteDb() {
  if (!sqliteDb) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    sqliteDb = new Database(dbPath);
  }

  return sqliteDb;
}

function getPgPool() {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL?.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined
    });
  }

  return pgPool;
}

async function initializePostgres() {
  const pool = getPgPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'investor')),
      amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      projected_return DOUBLE PRECISION NOT NULL DEFAULT 0,
      pending_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      disbursed_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      account_manager TEXT NOT NULL DEFAULT '',
      tier TEXT NOT NULL DEFAULT 'Starter',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS projected_return DOUBLE PRECISION NOT NULL DEFAULT 0;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS account_manager TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pending_amount DOUBLE PRECISION NOT NULL DEFAULT 0;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS disbursed_amount DOUBLE PRECISION NOT NULL DEFAULT 0;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id SERIAL PRIMARY KEY,
      investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      method TEXT NOT NULL,
      destination TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL
    );
  `);

  const createdAt = nowIso();
  await pool.query(
    `
      INSERT INTO users (full_name, email, password_hash, role, amount, projected_return, tier, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'admin', 0, 0, 'Administrator', 'Active', $4, $4)
      ON CONFLICT (email) DO NOTHING
    `,
    ["Main Admin", "admin@investment.local", hashPassword("Admin123!"), createdAt]
  );
}

function initializeSqlite() {
  const db = getSqliteDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'investor')),
      amount REAL NOT NULL DEFAULT 0,
      projected_return REAL NOT NULL DEFAULT 0,
      pending_amount REAL NOT NULL DEFAULT 0,
      disbursed_amount REAL NOT NULL DEFAULT 0,
      account_manager TEXT NOT NULL DEFAULT '',
      tier TEXT NOT NULL DEFAULT 'Starter',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const tableColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{
    name: string;
  }>;

  if (!tableColumns.some((column) => column.name === "projected_return")) {
    try {
      db.exec(
        "ALTER TABLE users ADD COLUMN projected_return REAL NOT NULL DEFAULT 0"
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("duplicate column name")
      ) {
        throw error;
      }
    }
  }

  if (!tableColumns.some((column) => column.name === "account_manager")) {
    try {
      db.exec(
        "ALTER TABLE users ADD COLUMN account_manager TEXT NOT NULL DEFAULT ''"
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("duplicate column name")
      ) {
        throw error;
      }
    }
  }

  if (!tableColumns.some((column) => column.name === "pending_amount")) {
    try {
      db.exec(
        "ALTER TABLE users ADD COLUMN pending_amount REAL NOT NULL DEFAULT 0"
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("duplicate column name")
      ) {
        throw error;
      }
    }
  }

  if (!tableColumns.some((column) => column.name === "disbursed_amount")) {
    try {
      db.exec(
        "ALTER TABLE users ADD COLUMN disbursed_amount REAL NOT NULL DEFAULT 0"
      );
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("duplicate column name")
      ) {
        throw error;
      }
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investor_id INTEGER NOT NULL,
      method TEXT NOT NULL,
      destination TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const createdAt = nowIso();
  db.prepare(
    `
      INSERT OR IGNORE INTO users (full_name, email, password_hash, role, amount, projected_return, tier, status, created_at, updated_at)
      VALUES (@fullName, @email, @passwordHash, 'admin', 0, 0, 'Administrator', 'Active', @createdAt, @updatedAt)
    `
  ).run({
    fullName: "Main Admin",
    email: "admin@investment.local",
    passwordHash: hashPassword("Admin123!"),
    createdAt,
    updatedAt: createdAt
  });
}

async function ensureDatabase() {
  if (!initPromise) {
    initPromise = usePostgres
      ? initializePostgres()
      : Promise.resolve().then(initializeSqlite);
  }

  await initPromise;
}

export async function authenticateUser(email: string, role?: UserRole) {
  await ensureDatabase();

  if (usePostgres) {
    const pool = getPgPool();
    const query = role
      ? "SELECT * FROM users WHERE email = $1 AND role = $2 LIMIT 1"
      : "SELECT * FROM users WHERE email = $1 LIMIT 1";
    const values = role ? [email, role] : [email];
    const result = await pool.query<DbUserRow>(query, values);
    return result.rows[0];
  }

  const db = getSqliteDb();
  const query = role
    ? "SELECT * FROM users WHERE email = ? AND role = ?"
    : "SELECT * FROM users WHERE email = ?";

  return db.prepare(query).get(email, ...(role ? [role] : [])) as
    | DbUserRow
    | undefined;
}

export async function listInvestors(): Promise<InvestorRecord[]> {
  await ensureDatabase();

  if (usePostgres) {
    const pool = getPgPool();
    const result = await pool.query(
      `
        SELECT id, full_name, email, amount, projected_return, pending_amount, disbursed_amount, account_manager, tier, status, created_at, updated_at
        FROM users
        WHERE role = 'investor'
        ORDER BY created_at DESC
      `
    );
    return result.rows.map((row) => mapInvestorRow(row));
  }

  const db = getSqliteDb();
  return db
    .prepare(
      `
        SELECT id, full_name, email, amount, projected_return, pending_amount, disbursed_amount, account_manager, tier, status, created_at, updated_at
        FROM users
        WHERE role = 'investor'
        ORDER BY created_at DESC
      `
    )
    .all()
    .map((row) => mapInvestorRow(row as Record<string, unknown>));
}

export async function getInvestorById(id: number): Promise<InvestorRecord | null> {
  await ensureDatabase();

  if (usePostgres) {
    const pool = getPgPool();
    const result = await pool.query(
      `
        SELECT id, full_name, email, amount, projected_return, pending_amount, disbursed_amount, account_manager, tier, status, created_at, updated_at
        FROM users
        WHERE id = $1 AND role = 'investor'
        LIMIT 1
      `,
      [id]
    );
    return result.rows[0] ? mapInvestorRow(result.rows[0]) : null;
  }

  const db = getSqliteDb();
  const row = db
    .prepare(
      `
        SELECT id, full_name, email, amount, projected_return, pending_amount, disbursed_amount, account_manager, tier, status, created_at, updated_at
        FROM users
        WHERE id = ? AND role = 'investor'
      `
    )
    .get(id) as Record<string, unknown> | undefined;

  return row ? mapInvestorRow(row) : null;
}

export async function getInvestorForSession(id: number): Promise<
  (SessionUser & {
    amount: number;
    projectedReturn: number;
    pendingAmount: number;
    disbursedAmount: number;
    accountManager: string;
    tier: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }) | null
> {
  await ensureDatabase();

  if (usePostgres) {
    const pool = getPgPool();
    const result = await pool.query<DbUserRow>(
      `
        SELECT id, full_name, email, password_hash, role, amount, projected_return, pending_amount, disbursed_amount, account_manager, tier, status, created_at, updated_at
        FROM users
        WHERE id = $1 AND role = 'investor'
        LIMIT 1
      `,
      [id]
    );
    return result.rows[0] ? mapSessionInvestor(result.rows[0]) : null;
  }

  const db = getSqliteDb();
  const row = db
    .prepare(
      `
        SELECT id, full_name, email, password_hash, role, amount, projected_return, pending_amount, disbursed_amount, account_manager, tier, status, created_at, updated_at
        FROM users
        WHERE id = ? AND role = 'investor'
      `
    )
    .get(id) as DbUserRow | undefined;

  return row ? mapSessionInvestor(row) : null;
}

export async function listWithdrawalRequests(
  investorId: number
): Promise<WithdrawalRecord[]> {
  await ensureDatabase();

  if (usePostgres) {
    const pool = getPgPool();
    const result = await pool.query<DbWithdrawalRow>(
      `
        SELECT id, investor_id, method, destination, amount, status, created_at
        FROM withdrawal_requests
        WHERE investor_id = $1
        ORDER BY created_at DESC
      `,
      [investorId]
    );
    return result.rows.map((row) => mapWithdrawalRow(row));
  }

  const db = getSqliteDb();
  return db
    .prepare(
      `
        SELECT id, investor_id, method, destination, amount, status, created_at
        FROM withdrawal_requests
        WHERE investor_id = ?
        ORDER BY created_at DESC
      `
    )
    .all(investorId)
    .map((row) => mapWithdrawalRow(row as Record<string, unknown>));
}

export async function createWithdrawalRequest(input: {
  investorId: number;
  method: string;
  destination: string;
  amount: number;
}) {
  await ensureDatabase();

  const investor = await getInvestorForSession(input.investorId);
  if (!investor) {
    throw new Error("Investor not found.");
  }

  const availableAmount =
    investor.amount + investor.projectedReturn - investor.pendingAmount - investor.disbursedAmount;

  if (input.amount <= 0) {
    throw new Error("Withdrawal amount must be greater than zero.");
  }

  if (input.amount > availableAmount) {
    throw new Error("Withdrawal amount exceeds available balance.");
  }

  const createdAt = nowIso();

  if (usePostgres) {
    const pool = getPgPool();
    await pool.query(
      `
        INSERT INTO withdrawal_requests (investor_id, method, destination, amount, status, created_at)
        VALUES ($1, $2, $3, $4, 'Pending', $5)
      `,
      [input.investorId, input.method, input.destination, input.amount, createdAt]
    );

    await pool.query(
      `
        UPDATE users
        SET pending_amount = pending_amount + $1,
            updated_at = $2
        WHERE id = $3 AND role = 'investor'
      `,
      [input.amount, createdAt, input.investorId]
    );
  } else {
    const db = getSqliteDb();
    db.prepare(
      `
        INSERT INTO withdrawal_requests (investor_id, method, destination, amount, status, created_at)
        VALUES (@investorId, @method, @destination, @amount, 'Pending', @createdAt)
      `
    ).run({
      investorId: input.investorId,
      method: input.method,
      destination: input.destination,
      amount: input.amount,
      createdAt
    });

    db.prepare(
      `
        UPDATE users
        SET pending_amount = pending_amount + @amount,
            updated_at = @updatedAt
        WHERE id = @id AND role = 'investor'
      `
    ).run({
      id: input.investorId,
      amount: input.amount,
      updatedAt: createdAt
    });
  }

  const updatedInvestor = await getInvestorForSession(input.investorId);
  const requests = await listWithdrawalRequests(input.investorId);

  return {
    investor: updatedInvestor,
    requests
  };
}

export async function createInvestor(input: {
  fullName: string;
  email: string;
  password: string;
  amount: number;
  projectedReturn: number;
  accountManager: string;
  tier: string;
  status: string;
}) {
  await ensureDatabase();
  const createdAt = nowIso();

  if (usePostgres) {
    const pool = getPgPool();
    const result = await pool.query<{ id: number }>(
      `
        INSERT INTO users (full_name, email, password_hash, role, amount, projected_return, account_manager, tier, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'investor', $4, $5, $6, $7, $8, $9, $9)
        RETURNING id
      `,
      [
        input.fullName,
        input.email,
        hashPassword(input.password),
        input.amount,
        input.projectedReturn,
        input.accountManager,
        input.tier,
        input.status,
        createdAt
      ]
    );
    return getInvestorById(result.rows[0].id);
  }

  const db = getSqliteDb();
  const result = db
    .prepare(
      `
        INSERT INTO users (full_name, email, password_hash, role, amount, projected_return, account_manager, tier, status, created_at, updated_at)
        VALUES (@fullName, @email, @passwordHash, 'investor', @amount, @projectedReturn, @accountManager, @tier, @status, @createdAt, @updatedAt)
      `
    )
    .run({
      fullName: input.fullName,
      email: input.email,
      passwordHash: hashPassword(input.password),
      amount: input.amount,
      projectedReturn: input.projectedReturn,
      accountManager: input.accountManager,
      tier: input.tier,
      status: input.status,
      createdAt,
      updatedAt: createdAt
    });

  return getInvestorById(Number(result.lastInsertRowid));
}

export async function updateInvestor(
  id: number,
  input: {
    fullName: string;
    email: string;
    amount: number;
    projectedReturn: number;
    accountManager: string;
    tier: string;
    status: string;
    password?: string;
  }
) {
  await ensureDatabase();
  const updatedAt = nowIso();

  if (usePostgres) {
    const pool = getPgPool();

    if (input.password && input.password.trim()) {
      await pool.query(
        `
          UPDATE users
          SET full_name = $1,
              email = $2,
              amount = $3,
              projected_return = $4,
              account_manager = $5,
              tier = $6,
              status = $7,
              password_hash = $8,
              updated_at = $9
          WHERE id = $10 AND role = 'investor'
        `,
        [
          input.fullName,
          input.email,
          input.amount,
          input.projectedReturn,
          input.accountManager,
          input.tier,
          input.status,
          hashPassword(input.password),
          updatedAt,
          id
        ]
      );
    } else {
      await pool.query(
        `
          UPDATE users
          SET full_name = $1,
              email = $2,
              amount = $3,
              projected_return = $4,
              account_manager = $5,
              tier = $6,
              status = $7,
              updated_at = $8
          WHERE id = $9 AND role = 'investor'
        `,
        [
          input.fullName,
          input.email,
          input.amount,
          input.projectedReturn,
          input.accountManager,
          input.tier,
          input.status,
          updatedAt,
          id
        ]
      );
    }

    return getInvestorById(id);
  }

  const db = getSqliteDb();

  if (input.password && input.password.trim()) {
    db.prepare(
      `
        UPDATE users
        SET full_name = @fullName,
            email = @email,
            amount = @amount,
            projected_return = @projectedReturn,
            account_manager = @accountManager,
            tier = @tier,
            status = @status,
            password_hash = @passwordHash,
            updated_at = @updatedAt
        WHERE id = @id AND role = 'investor'
      `
    ).run({
      id,
      fullName: input.fullName,
      email: input.email,
      amount: input.amount,
      projectedReturn: input.projectedReturn,
      accountManager: input.accountManager,
      tier: input.tier,
      status: input.status,
      passwordHash: hashPassword(input.password),
      updatedAt
    });
  } else {
    db.prepare(
      `
        UPDATE users
        SET full_name = @fullName,
            email = @email,
            amount = @amount,
            projected_return = @projectedReturn,
            account_manager = @accountManager,
            tier = @tier,
            status = @status,
            updated_at = @updatedAt
        WHERE id = @id AND role = 'investor'
      `
    ).run({
      id,
      fullName: input.fullName,
      email: input.email,
      amount: input.amount,
      projectedReturn: input.projectedReturn,
      accountManager: input.accountManager,
      tier: input.tier,
      status: input.status,
      updatedAt
    });
  }

  return getInvestorById(id);
}

export async function deleteInvestor(id: number) {
  await ensureDatabase();

  if (usePostgres) {
    const pool = getPgPool();
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 AND role = 'investor'",
      [id]
    );
    return { changes: result.rowCount ?? 0 };
  }

  const db = getSqliteDb();
  return db.prepare("DELETE FROM users WHERE id = ? AND role = 'investor'").run(id);
}
