import Link from "next/link";
import { redirect } from "next/navigation";
import { WithdrawCenter } from "@/components/withdraw-center";
import { getSessionUser } from "@/lib/auth";
import { getInvestorForSession } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function WithdrawPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "investor") {
    redirect("/admin");
  }

  const investor = await getInvestorForSession(user.id);
  if (!investor) {
    redirect("/login");
  }

  return (
    <main className="shell">
      <section className="hero-card fade-up">
        <div>
          <p className="eyebrow">Withdrawal Center</p>
          <h1>Move funds with your preferred payout method</h1>
          <p className="muted">
            Review available withdrawal channels and submit your preferred payout
            destination from one secure request screen.
          </p>
          <div className="hero-link-row">
            <Link className="secondary-button" href="/investor">
              Back to dashboard
            </Link>
          </div>
        </div>
        <div className="hero-actions">
          <div className="metric-card">
            <span>Available balance</span>
            <strong>${formatCurrency(investor.amount)}</strong>
          </div>
          <div className="metric-card">
            <span>Account tier</span>
            <strong>{investor.tier}</strong>
          </div>
        </div>
      </section>

      <div className="fade-up delay-1">
        <WithdrawCenter balance={investor.amount} tier={investor.tier} />
      </div>
    </main>
  );
}
