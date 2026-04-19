# Investment Admin Dashboard

A simple admin-managed investment portal built with Next.js. Admin users create investor accounts, assign balances and tiers, and investors log in to view only their own profile.

## Features

- Admin login with a seeded default account
- Admin dashboard to create, edit, and delete investor profiles
- Investor login with role-based redirect
- Investor dashboard showing assigned balance, tier, status, and profile details
- Local SQLite for development or hosted Postgres via `DATABASE_URL`
- Cookie-based session handling

## Default admin login

- Email: `admin@investment.local`
- Password: `Admin123!`

Change these after first login for any real deployment.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Suggested environment variables

Create a `.env.local` file with:

```env
SESSION_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Investments <no-reply@yourdomain.com>
```

## Notes before production

- Replace the default admin credentials immediately.
- Use HTTPS in production.
- Add rate limiting and audit logs.
- Consider adding password reset and stronger admin controls.
- For real multi-device shared data, set `DATABASE_URL` to Neon or another Postgres host.

## Onboarding Emails

When an admin creates a new investor, they can send an onboarding email with the login credentials they entered in the form.

To enable this:

1. Configure the SMTP environment variables above.
2. Create the investor from the admin dashboard.
3. Leave `Send onboarding email with the login credentials` checked.

If SMTP is not configured, the investor is still created and the UI will show that the email was skipped.
