import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

function getDb() {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
        throw new Error(
            "TURSO_DATABASE_URL is not set. Please add it to .env.local"
        );
    }

    const client = createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    return drizzle(client, { schema });
}

// Use a lazy singleton so the client isn't created at import time (e.g. during build)
let _db: ReturnType<typeof getDb> | null = null;

export function getDatabase() {
    if (!_db) {
        _db = getDb();
    }
    return _db;
}

// Re-export for convenience — will throw at runtime if env vars are missing
export const db = new Proxy({} as ReturnType<typeof getDb>, {
    get(_, prop) {
        return (getDatabase() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
