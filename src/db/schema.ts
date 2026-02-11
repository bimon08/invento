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
