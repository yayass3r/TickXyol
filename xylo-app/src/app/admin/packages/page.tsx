import { getCurrentUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PackagesManager from "./PackagesManager";

export default async function AdminPackagesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/admin");

  const supabase = createServerClient();
  const { data: packages } = await supabase
    .from("recharge_packages")
    .select("*")
    .order("display_order");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">إدارة الباقات</h1>
      </div>
      <PackagesManager initialPackages={packages || []} />
    </div>
  );
}
