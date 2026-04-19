import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getSessionUser } from "@/lib/auth";
import { listInvestors } from "@/lib/db";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/investor");
  }

  const investors = await listInvestors();

  return <AdminDashboard initialInvestors={investors} adminName={user.fullName} />;
}
