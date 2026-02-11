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
