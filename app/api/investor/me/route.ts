import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInvestorForSession } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "investor") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const investor = await getInvestorForSession(user.id);
  if (!investor) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ investor });
}
