"use server";

import { createServerAction } from "zsa";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getAppSession } from "@/lib/auth";
import { eq, and, like, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Helper to get orgId with auth check (supports both admin + staff)
async function getOrgId() {
    const session = await getAppSession();
    if (!session) throw new Error("Not authenticated");
    return session.orgId;
}

// ── Get Products ────────────────────────────────────────────────────────────────
export const getProducts = createServerAction()
    .input(
        z.object({
            search: z.string().optional(),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();

        if (input.search && input.search.trim() !== "") {
            return db
                .select()
                .from(products)
                .where(
                    and(
                        eq(products.orgId, orgId),
                        like(products.name, `%${input.search}%`)
                    )
                )
                .orderBy(products.name);
        }

        return db
            .select()
            .from(products)
            .where(eq(products.orgId, orgId))
            .orderBy(products.name);
    });

// ── Create Product ──────────────────────────────────────────────────────────────
export const createProduct = createServerAction()
    .input(
        z.object({
            name: z.string().min(1, "Product name is required"),
            brand: z.string().optional(),
            model: z.string().optional(),
            category: z.string().optional(),
            price: z.number().min(0, "Price must be positive"),
            stock: z.number().int().min(0, "Stock must be non-negative"),
            minStock: z.number().int().min(0).default(5),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();

        const [product] = await db
            .insert(products)
            .values({
                orgId,
                name: input.name,
                brand: input.brand || "",
                model: input.model || "",
                category: input.category || "",
                price: input.price,
                stock: input.stock,
                minStock: input.minStock,
            })
            .returning();

        revalidatePath("/");
        return product;
    });

// ── Update Product ──────────────────────────────────────────────────────────────
export const updateProduct = createServerAction()
    .input(
        z.object({
            id: z.string(),
            name: z.string().min(1, "Product name is required").optional(),
            brand: z.string().optional(),
            model: z.string().optional(),
            category: z.string().optional(),
            price: z.number().min(0).optional(),
            stock: z.number().int().min(0).optional(),
            minStock: z.number().int().min(0).optional(),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();
        const { id, ...updates } = input;

        const [product] = await db
            .update(products)
            .set(updates)
            .where(and(eq(products.id, id), eq(products.orgId, orgId)))
            .returning();

        revalidatePath("/");
        return product;
    });

// ── Delete Product ──────────────────────────────────────────────────────────────
export const deleteProduct = createServerAction()
    .input(
        z.object({
            id: z.string(),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();

        await db
            .delete(products)
            .where(and(eq(products.id, input.id), eq(products.orgId, orgId)));

        revalidatePath("/");
        return { success: true };
    });

// ── Adjust Stock ────────────────────────────────────────────────────────────────
export const adjustStock = createServerAction()
    .input(
        z.object({
            id: z.string(),
            delta: z.number().int(), // +1 or -1
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();

        const [product] = await db
            .update(products)
            .set({
                stock: sql`MAX(0, ${products.stock} + ${input.delta})`,
            })
            .where(and(eq(products.id, input.id), eq(products.orgId, orgId)))
            .returning();

        revalidatePath("/");
        return product;
    });
