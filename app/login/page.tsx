"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const text = await response.text();
      let data: { error?: string; redirectTo?: string } = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(data.error || "Unable to log in. Please restart the server and try again.");
        setLoading(false);
        return;
      }

      if (!data.redirectTo) {
        setError("Login succeeded but no redirect was returned.");
        setLoading(false);
        return;
      }

      window.location.href = data.redirectTo;
    } catch {
      setError("Unable to reach the server. Make sure `npm run dev` is running.");
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Admin-managed portal</p>
        <h1>Investment account access</h1>
        <p className="muted">
          Investors only see the records assigned to them. Admin users can
          create accounts, assign balances, and manage tiers.
        </p>

        <form className="stack-form" onSubmit={handleSubmit}>
          <div>
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          {error ? <p className="form-message">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
