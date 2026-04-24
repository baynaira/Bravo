"use client";

import { useState, type ReactNode } from "react";
import { formatCurrency } from "@/lib/format";
import type { WithdrawalRecord } from "@/lib/types";

type WithdrawCenterProps = {
  accountProfit: number;
  pendingAmount: number;
  disbursedAmount: number;
  tier: string;
  initialRequests: WithdrawalRecord[];
};

function Glyph({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={className} aria-hidden="true">{children}</span>;
}

const methods = [
  {
    id: "btc",
    label: "Bitcoin",
    helper: "Withdraw to a BTC wallet address",
    fieldLabel: "BTC wallet address",
    placeholder: "bc1q...",
    badge: "₿",
    badgeClass: "btc-badge"
  },
  {
    id: "paypal",
    label: "PayPal",
    helper: "Withdraw to your PayPal email",
    fieldLabel: "PayPal email",
    placeholder: "client@example.com",
    badge: "P",
    badgeClass: "paypal-badge"
  }
] as const;

export function WithdrawCenter({
  accountProfit: initialAccountProfit,
  pendingAmount: initialPendingAmount,
  disbursedAmount,
  tier,
  initialRequests
}: WithdrawCenterProps) {
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("btc");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [accountProfit, setAccountProfit] = useState(initialAccountProfit);
  const [pendingAmount, setPendingAmount] = useState(initialPendingAmount);
  const [requests, setRequests] = useState(initialRequests);
  const [submitting, setSubmitting] = useState(false);

  const activeMethod = methods.find((item) => item.id === method) ?? methods[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);
    if (!amount || parsedAmount <= 0 || !destination.trim()) {
      setMessage("Enter an amount and a valid destination.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const response = await fetch("/api/investor/withdrawals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: parsedAmount,
        destination,
        method: activeMethod.label
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Unable to submit withdrawal request.");
      setSubmitting(false);
      return;
    }

    const nextPendingAmount = Number(data.investor?.pendingAmount ?? pendingAmount);
    setPendingAmount(nextPendingAmount);
    setAccountProfit(Math.max(initialAccountProfit + initialPendingAmount - nextPendingAmount, 0));
    setRequests(data.requests || requests);
    setAmount("");
    setDestination("");
    setMessage(data.notice || "Withdrawal submitted.");
    setSubmitting(false);
  }

  return (
    <div className="withdraw-layout">
      <section className="withdraw-stat-card-group fade-up delay-1">
        <article className="withdraw-stat-card">
          <div className="withdraw-stat-icon">
            <Glyph className="stat-glyph">$</Glyph>
          </div>
          <strong>${formatCurrency(accountProfit)}</strong>
          <span>Account Profit</span>
        </article>

        <article className="withdraw-stat-card pending-stat-card">
          <div className="withdraw-stat-icon">
            <Glyph className="stat-glyph">i</Glyph>
          </div>
          <strong>${formatCurrency(pendingAmount)}</strong>
          <span>Pending Amount</span>
        </article>

        <article className="withdraw-stat-card">
          <div className="withdraw-stat-icon">
            <Glyph className="stat-glyph">+</Glyph>
          </div>
          <strong>${formatCurrency(disbursedAmount)}</strong>
          <span>Disbursed Amount</span>
        </article>
      </section>

      <section className="payout-request-banner fade-up delay-1">
        <strong>Request Your Payouts</strong>
        <p>Minimum payout amount for withdrawal is $20</p>
      </section>

      <section className="withdraw-grid inspired-withdraw-grid fade-up delay-2">
        <div className="panel payout-panel">
          <div className="panel-header">
            <p className="eyebrow">Payout Methods</p>
            <h2>Choose your payment method</h2>
          </div>

          <div className="method-switcher">
            {methods.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === method ? "method-chip active-chip" : "method-chip"}
                onClick={() => setMethod(item.id)}
              >
                <span className="method-chip-title">
                  <span className={`method-chip-icon ${item.badgeClass}`}>
                    <Glyph className="payment-badge-glyph">{item.badge}</Glyph>
                  </span>
                  <span>{item.label}</span>
                </span>
                <small>{item.helper}</small>
              </button>
            ))}
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="two-column">
              <div>
                <label>Withdrawal amount</label>
                <input
                  type="number"
                  min="20"
                  max={accountProfit}
                  placeholder="250.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>

              <div>
                <label>Account tier</label>
                <input type="text" value={tier} readOnly />
              </div>
            </div>

            <div>
              <label>{activeMethod.fieldLabel}</label>
              <input
                type={method === "paypal" ? "email" : "text"}
                placeholder={activeMethod.placeholder}
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              />
            </div>

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Payout Request"}
            </button>

            {message ? <p className="form-message">{message}</p> : null}
          </form>
        </div>

        <div className="withdraw-side-stack">
          <div className="panel payout-method-panel">
            <div className="panel-header">
              <p className="eyebrow">Payout Methods</p>
              <h2>Available options</h2>
            </div>
            <p className="muted">
              Your satisfaction is our priority. Discover our supported payout
              methods tailored to your needs.
            </p>
            <div className="available-method-row">
              {methods.map((item) => (
                <div key={item.id} className="available-method-pill">
                  <span className={`method-chip-icon ${item.badgeClass}`}>
                    <Glyph className="payment-badge-glyph">{item.badge}</Glyph>
                  </span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel note-panel fade-up delay-2">
        <div className="panel-header">
          <p className="eyebrow">Note</p>
          <h2>Payout guidance</h2>
        </div>
        <ol className="note-list">
          <li>Pending amounts update immediately after you place a payout request.</li>
          <li>Please confirm wallet or email details before submitting your request.</li>
        </ol>
      </section>

      <section className="panel payout-history-panel fade-up delay-3">
        <div className="panel-header payout-history-header">
          <h2>Payout History</h2>
          <strong>Total Amount: ${formatCurrency(pendingAmount + disbursedAmount)}</strong>
        </div>

        <div className="payout-history-scroll">
          <div className="payout-history-table">
          <div className="payout-history-row payout-history-head">
            <span>Withdrawal ID</span>
            <span>Payment Type</span>
            <span>Requested Amount</span>
            <span>Created</span>
            <span>Status</span>
          </div>

          {requests.length === 0 ? (
            <div className="payout-history-empty">
              No payout requests have been recorded yet.
            </div>
          ) : (
            requests.map((request) => (
              <div className="payout-history-row" key={request.id}>
                <span>WD-{String(request.id).padStart(4, "0")}</span>
                <span>{request.method}</span>
                <span>${formatCurrency(request.amount)}</span>
                <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                <span>{request.status}</span>
              </div>
            ))
          )}
          </div>
        </div>
      </section>
    </div>
  );
}
