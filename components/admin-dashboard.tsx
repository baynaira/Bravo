"use client";

import { useEffect, useState } from "react";
import type { InvestorRecord } from "@/lib/types";

type AdminDashboardProps = {
  initialInvestors: InvestorRecord[];
  adminName: string;
};

type FormState = {
  fullName: string;
  email: string;
  password: string;
  amount: string;
  projectedReturn: string;
  tier: string;
  status: string;
  sendWelcomeEmail: boolean;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  amount: "",
  projectedReturn: "",
  tier: "Bronze",
  status: "Active",
  sendWelcomeEmail: true
};

export function AdminDashboard({
  initialInvestors,
  adminName
}: AdminDashboardProps) {
  const [investors, setInvestors] = useState(initialInvestors);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setInvestors(initialInvestors);
  }, [initialInvestors]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const payload = {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      amount: Number(form.amount),
      projectedReturn: Number(form.projectedReturn),
      tier: form.tier,
      status: form.status,
      sendWelcomeEmail: form.sendWelcomeEmail
    };

    const response = await fetch(
      editingId ? `/api/admin/investors/${editingId}` : "/api/admin/investors",
      {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Unable to save investor.");
      setSubmitting(false);
      return;
    }

    const nextInvestors = editingId
      ? investors.map((investor) =>
          investor.id === editingId ? data.investor : investor
        )
      : [data.investor, ...investors];

    setInvestors(nextInvestors);
    setForm(emptyForm);
    setEditingId(null);
    setSubmitting(false);
    setMessage(
      editingId
        ? "Investor updated."
        : data.notice || "Investor created."
    );
  }

  function startEdit(investor: InvestorRecord) {
    setEditingId(investor.id);
    setForm({
      fullName: investor.fullName,
      email: investor.email,
      password: "",
      amount: String(investor.amount),
      projectedReturn: String(investor.projectedReturn),
      tier: investor.tier,
      status: investor.status,
      sendWelcomeEmail: false
    });
    setMessage("");
  }

  async function removeInvestor(id: number) {
    const confirmed = window.confirm(
      "Delete this investor account? This cannot be undone."
    );
    if (!confirmed) return;

    const response = await fetch(`/api/admin/investors/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error || "Unable to delete investor.");
      return;
    }

    setInvestors((current) => current.filter((investor) => investor.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    setMessage("Investor deleted.");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const totalAssets = investors.reduce(
    (sum, investor) => sum + Number(investor.amount),
    0
  );

  return (
    <main className="shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Admin Control Center</p>
          <h1>Manage every investor account from one place</h1>
          <p className="muted">
            Create investor logins, assign balances, set tiers, and keep full
            administrative control.
          </p>
        </div>
        <div className="hero-actions">
          <div className="metric-card">
            <span>Total investors</span>
            <strong>{investors.length}</strong>
          </div>
          <div className="metric-card">
            <span>Total assigned balance</span>
            <strong>${totalAssets.toLocaleString()}</strong>
          </div>
          <button className="secondary-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Signed in as</p>
              <h2>{adminName}</h2>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <div>
              <label>Investor name</label>
              <input
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value
                  }))
                }
                placeholder="Investor full name"
                required
              />
            </div>

            <div>
              <label>Email / login</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                }
                placeholder="investor@email.com"
                required
              />
            </div>

            <div>
              <label>
                {editingId ? "New password (optional)" : "Temporary password"}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value
                  }))
                }
                placeholder={editingId ? "Leave blank to keep current" : "Create a password"}
                required={!editingId}
              />
            </div>

            <div className="two-column">
              <div>
                <label>Portfolio balance</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: event.target.value
                    }))
                  }
                  placeholder="5000"
                  required
                />
              </div>

              <div>
                <label>Projected return</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.projectedReturn}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      projectedReturn: event.target.value
                    }))
                  }
                  placeholder="140.00"
                  required
                />
              </div>
            </div>

            <div className="two-column">
              <div>
                <label>Tier</label>
                <select
                  value={form.tier}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tier: event.target.value
                    }))
                  }
                >
                  <option>Bronze</option>
                  <option>Silver</option>
                  <option>Gold</option>
                  <option>Platinum</option>
                  <option>VIP</option>
                </select>
              </div>
            </div>

            <div>
              <label>Status</label>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value
                  }))
                }
              >
                <option>Active</option>
                <option>Pending</option>
                <option>Paused</option>
                <option>Closed</option>
              </select>
            </div>

            {!editingId ? (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.sendWelcomeEmail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sendWelcomeEmail: event.target.checked
                    }))
                  }
                />
                <span>Send onboarding email with the login credentials</span>
              </label>
            ) : null}

            <div className="button-row">
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Update investor"
                    : "Create investor"}
              </button>
              {editingId ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setMessage("");
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            {message ? <p className="form-message">{message}</p> : null}
          </form>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Investor accounts</p>
              <h2>Live records</h2>
            </div>
          </div>

          <div className="investor-list">
            {investors.length === 0 ? (
              <div className="empty-state">
                No investor accounts yet. Create the first one from the form.
              </div>
            ) : (
              investors.map((investor) => (
                <article className="investor-card" key={investor.id}>
                  <div>
                    <h3>{investor.fullName}</h3>
                    <p>{investor.email}</p>
                  </div>
                  <div className="pill-row">
                    <span className="pill">{investor.tier}</span>
                    <span className="pill muted-pill">{investor.status}</span>
                  </div>
                  <div className="amount">${investor.amount.toLocaleString()}</div>
                  <div className="card-footer">
                    <small>
                      Updated {new Date(investor.updatedAt).toLocaleString()}
                    </small>
                    <div className="button-row">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => startEdit(investor)}
                      >
                        Edit
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => removeInvestor(investor.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
