import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createInvestor, listInvestors } from "@/lib/db";
import { isEmailConfigured, sendInvestorWelcomeEmail } from "@/lib/email";

function validateInvestorPayload(body: Record<string, unknown>, isCreate = true) {
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const amount = Number(body.amount);
  const projectedReturn = Number(body.projectedReturn);
  const accountManager = String(body.accountManager || "").trim();
  const tier = String(body.tier || "").trim();
  const status = String(body.status || "").trim();
  const sendWelcomeEmail = Boolean(body.sendWelcomeEmail);

  if (
    !fullName ||
    !email ||
    !tier ||
    !accountManager ||
    !status ||
    Number.isNaN(amount) ||
    Number.isNaN(projectedReturn)
  ) {
    return { error: "Please complete all required fields." };
  }

  if (amount < 0) {
    return { error: "Amount cannot be negative." };
  }

  if (projectedReturn < 0) {
    return { error: "Projected return cannot be negative." };
  }

  if (isCreate && password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  return {
    fullName,
    email,
    password,
    amount,
    projectedReturn,
    accountManager,
    tier,
    status,
    sendWelcomeEmail
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ investors: await listInvestors() });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = validateInvestorPayload(await request.json(), true);
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  try {
    const investor = await createInvestor(payload);
    let notice = "Investor created.";

    if (payload.sendWelcomeEmail) {
      if (!isEmailConfigured()) {
        notice =
          "Investor created, but onboarding email was skipped because SMTP is not configured yet.";
      } else {
        try {
          await sendInvestorWelcomeEmail({
            fullName: payload.fullName,
            email: payload.email,
            password: payload.password,
            tier: payload.tier,
            amount: payload.amount
          });
          notice = "Investor created and onboarding email sent.";
        } catch {
          notice =
            "Investor created, but the onboarding email could not be delivered.";
        }
      }
    }

    return NextResponse.json({ investor, notice }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("UNIQUE")
        ? "That email is already in use."
        : "Unable to create investor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
