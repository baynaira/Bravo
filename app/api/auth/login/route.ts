import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user = await authenticateUser(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  await setSessionCookie({
    id: user.id,
    role: user.role,
    fullName: user.full_name,
    email: user.email
  });

  return NextResponse.json({
    redirectTo: user.role === "admin" ? "/admin" : "/investor"
  });
}
