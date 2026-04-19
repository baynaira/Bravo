"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

type WithdrawCenterProps = {
  balance: number;
  tier: string;
};

const methods = [
  {
    id: "btc",
    label: "Bitcoin",
    helper: "Withdraw to a BTC wallet address",
    fieldLabel: "BTC wallet address",
    placeholder: "bc1q..."
  },
  {
    id: "paypal",
    label: "PayPal",
    helper: "Withdraw to your PayPal email",
    fieldLabel: "PayPal email",
    placeholder: "client@example.com"
  }
] as const;

export function WithdrawCenter({ balance, tier }: WithdrawCenterProps) {
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("btc");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");

  const activeMethod = methods.find((item) => item.id === method) ?? methods[0];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!amount || Number(amount) <= 0 || !destination.trim()) {
      setMessage("Enter an amount and a valid destination.");
      return;
    }

    setMessage("Withdrawal temporarily unavailable for your tier");
  }

  return (
    <section className="content-grid withdraw-grid">
      <div className="panel">
        <div className="panel-header">
          <p className="eyebrow">Withdrawal Methods</p>
          <h2>Request a withdrawal</h2>
        </div>

        <div className="method-switcher">
          {methods.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === method ? "method-chip active-chip" : "method-chip"}
              onClick={() => setMethod(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.helper}</small>
            </button>
          ))}
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <div className="two-column">
            <div>
              <label>Amount</label>
              <input
                type="number"
                min="1"
                max={balance}
                placeholder="2500"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div>
              <label>Tier</label>
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

          <button className="primary-button" type="submit">
            Submit request
          </button>

          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <p className="eyebrow">Withdrawal Summary</p>
          <h2>Account limits</h2>
        </div>
        <div className="detail-grid single-column">
          <article className="detail-card">
            <span>Available balance</span>
            <h3>${formatCurrency(balance)}</h3>
          </article>
          <article className="detail-card">
            <span>Selected method</span>
            <h3>{activeMethod.label}</h3>
          </article>
        </div>
      </div>
    </section>
  );
}
