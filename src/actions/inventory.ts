"use server";

import { createServerAction } from "zsa";
import { z } from "zod";
import { db } from "@/db";
import { products, categories, brands } from "@/db/schema";
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

// ── Get Categories ──────────────────────────────────────────────────────────────
export const getCategories = createServerAction()
    .handler(async () => {
        const orgId = await getOrgId();
        const rows = await db
            .select()
            .from(categories)
            .where(eq(categories.orgId, orgId))
            .orderBy(categories.name);
        return rows.map((r) => r.name);
    });

// ── Create Category ─────────────────────────────────────────────────────────────
export const createCategory = createServerAction()
    .input(
        z.object({
            name: z.string().min(1, "Category name is required"),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();

        // Check if already exists
        const [existing] = await db
            .select()
            .from(categories)
            .where(and(eq(categories.orgId, orgId), eq(categories.name, input.name)))
            .limit(1);

        if (existing) return existing;

        const [cat] = await db
            .insert(categories)
            .values({ orgId, name: input.name })
            .returning();

        return cat;
    });

// ── Get Brands ──────────────────────────────────────────────────────────────────
export const getBrands = createServerAction()
    .handler(async () => {
        const orgId = await getOrgId();
        const rows = await db
            .select()
            .from(brands)
            .where(eq(brands.orgId, orgId))
            .orderBy(brands.name);
        return rows.map((r) => r.name);
    });

// ── Create Brand ────────────────────────────────────────────────────────────────
export const createBrand = createServerAction()
    .input(
        z.object({
            name: z.string().min(1, "Brand name is required"),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();

        // Check if already exists
        const [existing] = await db
            .select()
            .from(brands)
            .where(and(eq(brands.orgId, orgId), eq(brands.name, input.name)))
            .limit(1);

        if (existing) return existing;

        const [brand] = await db
            .insert(brands)
            .values({ orgId, name: input.name })
            .returning();

        return brand;
    });

// ── Update Category ─────────────────────────────────────────────────────────────
export const updateCategory = createServerAction()
    .input(
        z.object({
            id: z.string(),
            name: z.string().min(1, "Category name is required"),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();
        const session = await getAppSession();
        if (!session?.isAdmin) throw new Error("Only admins can edit categories");

        const [cat] = await db
            .update(categories)
            .set({ name: input.name })
            .where(and(eq(categories.id, input.id), eq(categories.orgId, orgId)))
            .returning();

        revalidatePath("/settings");
        return cat;
    });

// ── Delete Category ─────────────────────────────────────────────────────────────
export const deleteCategory = createServerAction()
    .input(
        z.object({
            id: z.string(),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();
        const session = await getAppSession();
        if (!session?.isAdmin) throw new Error("Only admins can delete categories");

        await db
            .delete(categories)
            .where(and(eq(categories.id, input.id), eq(categories.orgId, orgId)));

        revalidatePath("/settings");
        return { success: true };
    });

// ── Update Brand ────────────────────────────────────────────────────────────────
export const updateBrand = createServerAction()
    .input(
        z.object({
            id: z.string(),
            name: z.string().min(1, "Brand name is required"),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();
        const session = await getAppSession();
        if (!session?.isAdmin) throw new Error("Only admins can edit brands");

        const [brand] = await db
            .update(brands)
            .set({ name: input.name })
            .where(and(eq(brands.id, input.id), eq(brands.orgId, orgId)))
            .returning();

        revalidatePath("/settings");
        return brand;
    });

// ── Delete Brand ────────────────────────────────────────────────────────────────
export const deleteBrand = createServerAction()
    .input(
        z.object({
            id: z.string(),
        })
    )
    .handler(async ({ input }) => {
        const orgId = await getOrgId();
        const session = await getAppSession();
        if (!session?.isAdmin) throw new Error("Only admins can delete brands");

        await db
            .delete(brands)
            .where(and(eq(brands.id, input.id), eq(brands.orgId, orgId)));

        revalidatePath("/settings");
        return { success: true };
    });

// ── Get Categories with IDs ─────────────────────────────────────────────────────
export const getCategoriesWithIds = createServerAction()
    .handler(async () => {
        const orgId = await getOrgId();
        return db
            .select()
            .from(categories)
            .where(eq(categories.orgId, orgId))
            .orderBy(categories.name);
    });

// ── Get Brands with IDs ────────────────────────────────────────────────────────
export const getBrandsWithIds = createServerAction()
    .handler(async () => {
        const orgId = await getOrgId();
        return db
            .select()
            .from(brands)
            .where(eq(brands.orgId, orgId))
            .orderBy(brands.name);
    });
