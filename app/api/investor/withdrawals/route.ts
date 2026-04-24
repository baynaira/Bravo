import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createWithdrawalRequest } from "@/lib/db";
import {
  isEmailConfigured,
  sendWithdrawalTierNoticeEmail
} from "@/lib/email";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "investor") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const amount = Number(body.amount);
  const method = String(body.method || "").trim();
  const destination = String(body.destination || "").trim();

  if (!method || !destination || Number.isNaN(amount)) {
    return NextResponse.json(
      { error: "Please enter an amount and payout destination." },
      { status: 400 }
    );
  }

  try {
    const result = await createWithdrawalRequest({
      investorId: user.id,
      method,
      destination,
      amount
    });

    let notice = "Withdrawal submitted.";

    if (isEmailConfigured()) {
      try {
        await sendWithdrawalTierNoticeEmail({
          fullName: user.fullName,
          email: user.email
        });
      } catch {
        notice =
          "Withdrawal submitted. Notification email could not be delivered.";
      }
    }

    return NextResponse.json(
      {
        notice,
        investor: result.investor,
        requests: result.requests
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit withdrawal request."
      },
      { status: 400 }
    );
  }
}
