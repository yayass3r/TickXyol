import { getCurrentUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsersManager from "./UsersManager";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) redirect("/admin");

  const supabase = createServerClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, email, username, display_name, role, is_active, is_verified, kyc_status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">إدارة المستخدمين</h1>
      <UsersManager initialUsers={users || []} isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
