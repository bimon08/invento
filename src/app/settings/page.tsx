export const dynamic = "force-dynamic";

import { Header } from "@/components/Header";
import { SettingsManager } from "@/components/SettingsManager";

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-slate-950">
            <Header />
            <SettingsManager />
        </div>
    );
}
