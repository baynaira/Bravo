import Link from "next/link";
import { redirect } from "next/navigation";
import { WithdrawCenter } from "@/components/withdraw-center";
import { getSessionUser } from "@/lib/auth";
import { getInvestorForSession, listWithdrawalRequests } from "@/lib/db";

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

  const totalPortfolio = investor.amount + investor.projectedReturn;
  const accountProfit = Math.max(
    totalPortfolio - investor.pendingAmount - investor.disbursedAmount,
    0
  );
  const requests = await listWithdrawalRequests(investor.id);

  return (
    <main className="shell investor-shell">
      <section className="withdraw-shell fade-up">
        <div className="withdraw-page-top">
          <div>
            <p className="eyebrow">Payout Center</p>
            <h1>Request Your Payouts</h1>
          </div>
          <Link className="secondary-button" href="/investor">
            Back
          </Link>
        </div>

        <WithdrawCenter
          accountProfit={accountProfit}
          pendingAmount={investor.pendingAmount}
          disbursedAmount={investor.disbursedAmount}
          tier={investor.tier}
          initialRequests={requests}
        />
      </section>
    </main>
  );
}
