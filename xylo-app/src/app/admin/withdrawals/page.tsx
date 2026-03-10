import { getCurrentUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WithdrawalsManager from "./WithdrawalsManager";

export default async function AdminWithdrawalsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/admin");

  const supabase = createServerClient();
  const { data: withdrawals } = await supabase
    .from("withdrawal_requests")
    .select("*, user:user_id(id, username, display_name, email)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">طلبات السحب</h1>
      <WithdrawalsManager initialWithdrawals={withdrawals || []} />
    </div>
  );
}
