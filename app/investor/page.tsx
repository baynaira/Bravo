import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getInvestorForSession } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export default async function InvestorPage() {
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

  const estimatedValue = investor.amount + investor.projectedReturn;
  const reviewDate = new Date(investor.updatedAt);
  reviewDate.setDate(reviewDate.getDate() + 14);
  const payoutMethod =
    investor.tier === "VIP" ? "Priority BTC / PayPal" : "BTC / PayPal";
  const initials = investor.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="shell">
      <header className="mobile-investor-bar fade-up">
        <div className="brand-chip">
          <span className="brand-orb" />
          <div>
            <small>Portfolio</small>
            <strong>BRAVO</strong>
          </div>
        </div>

        <div className="profile-chip">
          <div className="avatar-badge">{initials}</div>
          <div>
            <small>Investor</small>
            <strong>{investor.fullName}</strong>
          </div>
        </div>
      </header>

      <section className="wealth-hero fade-up">
        <div className="wealth-primary">
          <div>
            <p className="eyebrow">Private Client Portal</p>
            <h1>
              <span className="welcome-accent">Welcome back,</span>{" "}
              {investor.fullName}
            </h1>
            <p className="muted">
              Your investor dashboard is organized to give you a clear view of
              portfolio value, tier access, and withdrawal readiness.
            </p>
          </div>

          <div className="wealth-balance-card">
            <span>Total portfolio balance</span>
            <strong>${formatCurrency(investor.amount)}</strong>
            <div className="wealth-balance-meta">
              <div>
                <small>Estimated portfolio value</small>
                <b>${formatCurrency(estimatedValue)}</b>
              </div>
              <div>
                <small>Projected return</small>
                <b>${formatCurrency(investor.projectedReturn)}</b>
              </div>
            </div>
          </div>
        </div>

        <div className="wealth-aside">
          <article className="wealth-status-panel">
            <div className="wealth-status-top">
              <span className="eyebrow">Account Standing</span>
              <span className="live-tag">Active monitoring</span>
            </div>
            <div className="wealth-status-grid">
              <div>
                <small>Tier</small>
                <strong>{investor.tier}</strong>
              </div>
              <div>
                <small>Status</small>
                <strong>{investor.status}</strong>
              </div>
              <div>
                <small>Review date</small>
                <strong>{reviewDate.toLocaleDateString()}</strong>
              </div>
              <div>
                <small>Payout methods</small>
                <strong>{payoutMethod}</strong>
              </div>
            </div>
            <div className="hero-link-row">
              <Link className="primary-button" href="/withdraw">
                Open withdrawal center
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="secondary-button" type="submit">
                  Log out
                </button>
              </form>
            </div>
          </article>
        </div>
      </section>

      <section className="executive-grid fade-up delay-1">
        <article className="executive-card investor-name-card">
          <span>Investor Name</span>
          <strong>{investor.fullName}</strong>
          <small>Primary account holder</small>
        </article>
        <article className="executive-card">
          <span>Portfolio ID</span>
          <strong>INV-{String(investor.id).padStart(4, "0")}</strong>
          <small>Client access record</small>
        </article>
        <article className="executive-card">
          <span>Member Since</span>
          <strong>{new Date(investor.createdAt).toLocaleDateString()}</strong>
          <small>Original account opening date</small>
        </article>
        <article className="executive-card">
          <span>Active Plan</span>
          <strong>{investor.tier} Income Strategy</strong>
          <small>Managed by portfolio administration</small>
        </article>
        <article className="executive-card">
          <span>Withdrawal Access</span>
          <strong>Available</strong>
          <small>BTC and PayPal request channels</small>
        </article>
      </section>

      <section className="portfolio-grid fade-up delay-2">
        <article className="panel portfolio-panel">
          <div className="panel-header">
            <p className="eyebrow">Portfolio Snapshot</p>
            <h2>Allocation and performance</h2>
          </div>

          <div className="allocation-grid">
            <article className="allocation-card">
              <span>Capital allocation</span>
              <strong>${formatCurrency(investor.amount)}</strong>
              <div className="mini-chart wide-chart">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </article>

            <article className="allocation-card">
              <span>Projected return</span>
              <strong>${formatCurrency(investor.projectedReturn)}</strong>
              <p className="muted">
                Based on your current portfolio tier and account profile.
              </p>
            </article>

            <article className="allocation-card">
              <span>Estimated total value</span>
              <strong>${formatCurrency(estimatedValue)}</strong>
              <p className="muted">
                Combined principal and projected return estimate.
              </p>
            </article>
          </div>
        </article>

        <article className="panel relationship-panel">
          <div className="panel-header">
            <p className="eyebrow">Client Relationship</p>
            <h2>Account profile</h2>
          </div>

          <div className="relationship-stack">
            <div className="relationship-row">
              <span>Account manager</span>
              <strong>Portfolio Operations Desk</strong>
            </div>
            <div className="relationship-row">
              <span>Security review</span>
              <strong>Protected client access</strong>
            </div>
            <div className="relationship-row">
              <span>Payout preference</span>
              <strong>{payoutMethod}</strong>
            </div>
            <div className="relationship-row">
              <span>Last account update</span>
              <strong>{new Date(investor.updatedAt).toLocaleDateString()}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="activity-layout fade-up delay-3">
        <article className="panel activity-panel">
          <div className="panel-header">
            <p className="eyebrow">Recent Activity</p>
            <h2>Account timeline</h2>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-date">
                {new Date(investor.createdAt).toLocaleDateString()}
              </span>
              <div>
                <strong>Portfolio account opened</strong>
                <p className="muted">
                  Your client profile was created and activated for secure
                  access.
                </p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-date">
                {new Date(investor.updatedAt).toLocaleDateString()}
              </span>
              <div>
                <strong>Portfolio balance updated</strong>
                <p className="muted">
                  Your latest account balance and tier records were synchronized.
                </p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="timeline-date">
                {reviewDate.toLocaleDateString()}
              </span>
              <div>
                <strong>Scheduled account review</strong>
                <p className="muted">
                  Your portfolio profile is queued for the next account review
                  cycle.
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="panel payout-panel">
          <div className="panel-header">
            <p className="eyebrow">Payout Center</p>
            <h2>Withdrawal access</h2>
          </div>
          <div className="payout-box">
            <span className="signal-badge neutral-badge">Secure request flow</span>
            <strong>Initiate a withdrawal request</strong>
            <p className="muted">
              Review your eligible payout methods and submit a withdrawal
              request through the dedicated client withdrawal center.
            </p>
            <Link className="primary-button" href="/withdraw">
              Continue to withdrawal
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
