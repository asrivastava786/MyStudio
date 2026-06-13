import "server-only";
import nodemailer from "nodemailer";

// Single shared transporter for all outgoing mail (Brevo SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST!,
  port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER!,
    pass: process.env.EMAIL_SERVER_PASSWORD!,
  },
});

export async function sendPasswordResetEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM!,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

export async function sendWelcomeEmail(to: string, nameOrHandle?: string) {
  const name = nameOrHandle || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const signinUrl = `${baseUrl}/auth/signin`;

  const html = `
<div style="font-family:Inter,system-ui,-apple-system;line-height:1.55;color:#111">
  <h2 style="margin:0 0 12px">Welcome to ZORY Studio!</h2>
  <p>Hi${name ? ` <strong>${name}</strong>` : ""}, great to have you in our community.</p>
  <p>You can now sign in to your designer panel and complete your profile:</p>
  <p>
    <a href="${signinUrl}"
       style="display:inline-block;padding:10px 20px;background:#000;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
      Go to sign in
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:18px 0">
  <p style="font-size:13px;color:#555;margin:0">
    If you didn't create this account, you can safely ignore this email.
  </p>
</div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Welcome to ZORY Studio",
    html,
    headers: { "X-Transactional-Tag": "welcome" },
  });
}
