import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteInvestor, updateInvestor } from "@/lib/db";

function validateInvestorPayload(body: Record<string, unknown>) {
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const amount = Number(body.amount);
  const projectedReturn = Number(body.projectedReturn);
  const tier = String(body.tier || "").trim();
  const status = String(body.status || "").trim();

  if (
    !fullName ||
    !email ||
    !tier ||
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

  if (password && password.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }

  return {
    fullName,
    email,
    password,
    amount,
    projectedReturn,
    tier,
    status
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const investorId = Number(id);
  const payload = validateInvestorPayload(await request.json());
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 });
  }

  try {
    const investor = await updateInvestor(investorId, payload);
    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ investor });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("UNIQUE")
        ? "That email is already in use."
        : "Unable to update investor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteInvestor(Number(id));
  if (result.changes === 0) {
    return NextResponse.json({ error: "Investor not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
