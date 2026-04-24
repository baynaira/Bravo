import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getInvestorForSession } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

function Icon({
  path,
  className
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

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

  const totalPortfolio = investor.amount + investor.projectedReturn;
  const initials = investor.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="shell investor-shell investor-app-screen">
      <header className="apex-topbar fade-up">
        <div className="apex-brand" aria-label="Bravo Roan">
          <div className="apex-brand-mark">BR</div>
          <div>
            <small>Bravo Roan</small>
            <strong>Investor Access</strong>
          </div>
        </div>

        <div className="apex-user">
          <div>
            <small>Investor</small>
            <strong>{investor.fullName}</strong>
          </div>
          <div className="apex-user-avatar">{initials}</div>
        </div>
      </header>

      <section className="portfolio-hero-card fade-up delay-1">
        <div className="portfolio-hero-top">
          <div className="hero-greeting">
            <small>Good evening</small>
            <h1>{investor.fullName}</h1>
          </div>
          <span className="hero-active-chip">
            <span className="green-dot" />
            Active
          </span>
        </div>

        <div className="portfolio-total-block">
          <small>Total Portfolio</small>
          <strong>${formatCurrency(totalPortfolio)}</strong>
          <div className="portfolio-growth">
            <span>+${formatCurrency(investor.projectedReturn)}</span>
            <small>projected return</small>
          </div>
        </div>

        <div className="portfolio-line-chart" aria-hidden="true">
          <svg
            viewBox="0 0 320 84"
            preserveAspectRatio="none"
            className="portfolio-chart-svg"
          >
            <defs>
              <linearGradient id="bravoChartGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(44, 209, 110, 0.15)" />
                <stop offset="100%" stopColor="rgba(44, 209, 110, 0.02)" />
              </linearGradient>
            </defs>
            <path
              d="M0 72 C35 70, 52 58, 82 60 S126 65, 156 52 S214 46, 242 42 S292 30, 320 24 L320 84 L0 84 Z"
              fill="url(#bravoChartGlow)"
            />
            <path
              d="M0 72 C35 70, 52 58, 82 60 S126 65, 156 52 S214 46, 242 42 S292 30, 320 24"
              className="portfolio-chart-line"
            />
          </svg>
        </div>
      </section>

      <section className="apex-mini-stats fade-up delay-2">
        <article className="mini-stat-card">
          <span className="mini-stat-icon">
            <Icon
              path="M8 7h8M8 12h8M8 17h5M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
              className="tiny-icon"
            />
          </span>
          <small>Tier</small>
          <strong>{investor.tier}</strong>
        </article>
        <article className="mini-stat-card">
          <span className="mini-stat-icon">
            <Icon
              path="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9Zm0-13v4l2.5 2.5"
              className="tiny-icon"
            />
          </span>
          <small>Status</small>
          <strong>{investor.status}</strong>
        </article>
        <article className="mini-stat-card">
          <span className="mini-stat-icon">
            <Icon
              path="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
              className="tiny-icon"
            />
          </span>
          <small>Manager</small>
          <strong>{investor.accountManager}</strong>
        </article>
      </section>

      <section className="balance-card fade-up delay-2">
        <div className="balance-card-top">
          <div>
            <small>Initial Balance</small>
            <strong>${formatCurrency(investor.amount)}</strong>
          </div>
          <span className="balance-card-badge">
            <Icon
              path="M12 3v18M7 8.5c0-1.9 2-3.5 5-3.5s5 1.6 5 3.5-1.7 2.8-5 3.5-5 1.5-5 3.5S9 19 12 19s5-1.6 5-3.5"
              className="tiny-icon"
            />
          </span>
        </div>
        <p>Initial balance assigned to this investor account.</p>
      </section>

      <section className="apex-lower-grid fade-up delay-3">
        <article className="dashboard-section compact-section">
          <div className="section-heading">
            <span className="section-icon">
              <Icon
                path="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                className="tiny-icon"
              />
            </span>
            <div>
              <small>Profile</small>
              <h2>Account details</h2>
            </div>
          </div>

          <div className="profile-grid compact-grid">
            <div className="profile-detail">
              <small>Investor Name</small>
              <strong>{investor.fullName}</strong>
            </div>
            <div className="profile-detail">
              <small>Portfolio ID</small>
              <strong>INV-{String(investor.id).padStart(4, "0")}</strong>
            </div>
            <div className="profile-detail">
              <small>Member Since</small>
              <strong>
                {new Date(investor.createdAt).toLocaleDateString()}
              </strong>
            </div>
            <div className="profile-detail">
              <small>Projected Return</small>
              <strong>${formatCurrency(investor.projectedReturn)}</strong>
            </div>
          </div>
        </article>

        <article className="dashboard-section compact-section">
          <div className="section-heading">
            <span className="section-icon">
              <Icon
                path="M12 3v12M7 10l5 5 5-5M5 21h14"
                className="tiny-icon"
              />
            </span>
            <div>
              <small>Withdraw</small>
              <h2>Payout access</h2>
            </div>
          </div>

          <p className="withdraw-copy">
            Review available payout methods and manage withdrawal access from
            your account center.
          </p>
          <Link className="primary-button full-width-button" href="/withdraw">
            Open Withdraw
          </Link>
        </article>

        <article className="dashboard-section compact-section" id="activity">
          <div className="section-heading">
            <span className="section-icon">
              <Icon
                path="M4 13h4l2-7 4 12 2-5h4"
                className="tiny-icon"
              />
            </span>
            <div>
              <small>Activity</small>
              <h2>Recent updates</h2>
            </div>
          </div>

          <div className="activity-list">
            <div className="activity-row">
              <span className="activity-dot" />
              <div>
                <b>Investor profile created</b>
                <small>{new Date(investor.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
            <div className="activity-row">
              <span className="activity-dot" />
              <div>
                <b>Balance reviewed</b>
                <small>{new Date(investor.updatedAt).toLocaleDateString()}</small>
              </div>
            </div>
            <div className="activity-row">
              <span className="activity-dot" />
              <div>
                <b>Projected return updated</b>
                <small>${formatCurrency(investor.projectedReturn)}</small>
              </div>
            </div>
          </div>
        </article>
      </section>

      <nav className="bottom-investor-nav apex-nav fade-up delay-3">
        <a className="nav-item active-item" href="/investor">
          <Icon
            path="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"
            className="nav-icon"
          />
          <span>Home</span>
        </a>
        <Link className="nav-item" href="/withdraw">
          <Icon
            path="M12 3v12M7 10l5 5 5-5M5 21h14"
            className="nav-icon"
          />
          <span>Withdraw</span>
        </Link>
        <a className="nav-item" href="#activity">
          <Icon
            path="M4 13h4l2-7 4 12 2-5h4"
            className="nav-icon"
          />
          <span>Activity</span>
        </a>
        <form
          className="nav-item logout-nav-item"
          action="/api/auth/logout"
          method="post"
        >
          <button type="submit" className="footer-logout-button">
            <Icon
              path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              className="nav-icon"
            />
            <span>Logout</span>
          </button>
        </form>
      </nav>
    </main>
  );
}
