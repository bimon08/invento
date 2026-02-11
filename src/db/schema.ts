import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const products = sqliteTable(
    "products",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        orgId: text("org_id").notNull(),
        name: text("name").notNull(),
        brand: text("brand").default(""),
        model: text("model").default(""),
        category: text("category").default(""),
        price: real("price").notNull(),
        stock: integer("stock").notNull().default(0),
        minStock: integer("min_stock").notNull().default(5),
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
        updatedAt: text("updated_at")
            .notNull()
            .default(sql`(datetime('now'))`)
            .$onUpdate(() => new Date().toISOString()),
    },
    (table) => [
        index("org_id_idx").on(table.orgId),
    ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export const joinCodes = sqliteTable(
    "join_codes",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        orgId: text("org_id").notNull(),
        orgName: text("org_name").notNull(),
        code: text("code").notNull().unique(),
        role: text("role").notNull().default("org:member"),
        createdBy: text("created_by").notNull(),
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
        expiresAt: text("expires_at"), // null = never expires
        isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    },
    (table) => [
        index("join_code_idx").on(table.code),
        index("join_code_org_idx").on(table.orgId),
    ]
);

export type JoinCode = typeof joinCodes.$inferSelect;
export type NewJoinCode = typeof joinCodes.$inferInsert;

// ── Staff Members (simple code + username auth) ─────────────────────────────
export const staffMembers = sqliteTable(
    "staff_members",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        orgId: text("org_id").notNull(),
        username: text("username").notNull(),
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
    },
    (table) => [
        index("staff_org_idx").on(table.orgId),
        index("staff_org_user_idx").on(table.orgId, table.username),
    ]
);

export type StaffMember = typeof staffMembers.$inferSelect;
export type NewStaffMember = typeof staffMembers.$inferInsert;

// ── Categories (per-store, saved for reuse) ─────────────────────────────────
export const categories = sqliteTable(
    "categories",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        orgId: text("org_id").notNull(),
        name: text("name").notNull(),
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
    },
    (table) => [
        index("cat_org_idx").on(table.orgId),
        index("cat_org_name_idx").on(table.orgId, table.name),
    ]
);

export type Category = typeof categories.$inferSelect;

// ── Brands (per-store, saved for reuse) ─────────────────────────────────────
export const brands = sqliteTable(
    "brands",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        orgId: text("org_id").notNull(),
        name: text("name").notNull(),
        createdAt: text("created_at")
            .notNull()
            .default(sql`(datetime('now'))`),
    },
    (table) => [
        index("brand_org_idx").on(table.orgId),
        index("brand_org_name_idx").on(table.orgId, table.name),
    ]
);

export type Brand = typeof brands.$inferSelect;
