import nodemailer from "nodemailer";

type WelcomeEmailInput = {
  fullName: string;
  email: string;
  password: string;
  tier: string;
  amount: number;
};

type WithdrawalNoticeInput = {
  fullName: string;
  email: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from };
}

export function isEmailConfigured() {
  return Boolean(getSmtpConfig());
}

export async function sendInvestorWelcomeEmail(input: WelcomeEmailInput) {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error("SMTP is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const formattedAmount = input.amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  await transporter.sendMail({
    from: config.from,
    to: input.email,
    subject: "Your investment portal login details",
    text: [
      `Hello ${input.fullName},`,
      "",
      "Your investment portal account has been created.",
      `Login URL: ${appUrl}/login`,
      `Email: ${input.email}`,
      `Password: ${input.password}`,
      `Tier: ${input.tier}`,
      `Initial Balance: $${formattedAmount}`
    ].join("\n"),
    html: `
      <div style="font-family: Georgia, serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 8px;">Welcome to your investment portal</h2>
        <p>Hello ${input.fullName},</p>
        <p>Your investor account has been created and is ready to access.</p>
        <div style="margin: 20px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <p style="margin: 0 0 8px;"><strong>Login URL:</strong> <a href="${appUrl}/login">${appUrl}/login</a></p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${input.email}</p>
          <p style="margin: 0 0 8px;"><strong>Password:</strong> ${input.password}</p>
          <p style="margin: 0 0 8px;"><strong>Tier:</strong> ${input.tier}</p>
          <p style="margin: 0;"><strong>Initial Balance:</strong> $${formattedAmount}</p>
        </div>
      </div>
    `
  });
}

export async function sendWithdrawalTierNoticeEmail(
  input: WithdrawalNoticeInput
) {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error("SMTP is not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  await transporter.sendMail({
    from: config.from,
    to: input.email,
    subject: "Withdrawal request update",
    text: [
      `Dear ${input.fullName},`,
      "",
      "Withdrawal is currently unavailable on your account tier.",
      "An account review is required to proceed.",
      "Please contact your Admin for assistance.",
      "",
      "Regards,",
      "Bravo"
    ].join("\n"),
    html: `
      <div style="font-family: Georgia, serif; line-height: 1.6; color: #111827;">
        <p>Dear ${input.fullName},</p>
        <p>Withdrawal is currently unavailable on your account tier.</p>
        <p>An account review is required to proceed.</p>
        <p>Please contact your Admin for assistance.</p>
        <p style="margin-top: 20px;">Regards,<br />Bravo</p>
      </div>
    `
  });
}
