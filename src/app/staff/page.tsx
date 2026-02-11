export const dynamic = "force-dynamic";

import { Header } from "@/components/Header";
import { StaffManager } from "@/components/StaffManager";

export default function StaffPage() {
    return (
        <div className="min-h-screen bg-slate-950">
            <Header />
            <StaffManager />
        </div>
    );
}
