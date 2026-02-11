export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, like, and } from "drizzle-orm";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { InventoryList } from "@/components/InventoryList";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Package, ArrowRight } from "lucide-react";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { orgId } = await auth();
  const params = await searchParams;

  // No org selected — show welcome
  if (!orgId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30">
          <Package className="h-12 w-12 text-white" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-white">
          Welcome to Invento
        </h1>
        <p className="mb-8 max-w-md text-base text-slate-400">
          Your mobile-first inventory management for repair shops.
          Create or select a store to get started.
        </p>
        <Link
          href="/org-selection"
          className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-95"
        >
          Create Your Store
          <ArrowRight className="h-4 w-4" />
        </Link>
        <PWAInstallBanner />
      </div>
    );
  }

  // Fetch products for this org
  const search = params.q || "";
  let productList;

  if (search) {
    productList = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.orgId, orgId),
          like(products.name, `%${search}%`)
        )
      )
      .orderBy(products.name);
  } else {
    productList = await db
      .select()
      .from(products)
      .where(eq(products.orgId, orgId))
      .orderBy(products.name);
  }

  return (
    <NuqsAdapter>
      <div className="flex min-h-screen flex-col bg-slate-950">
        <Header totalValue={productList.reduce((acc, p) => acc + p.price * p.stock, 0)} />
        <SearchBar />
        <PWAInstallBanner />
        <main className="flex-1 pb-24">
          <InventoryList products={productList} />
        </main>
      </div>
    </NuqsAdapter>
  );
}
