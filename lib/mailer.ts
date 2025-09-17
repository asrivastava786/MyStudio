// lib/mailer.ts
import "server-only";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST!,
  port: Number(process.env.EMAIL_SERVER_PORT!),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER!,
    pass: process.env.EMAIL_SERVER_PASSWORD!,
  },
});

export async function sendPasswordResetEmail(opts:{to: string, subject: string, html: string, text?: string}) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST!,
    port: Number(process.env.EMAIL_SERVER_PORT || 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER!,
      pass: process.env.EMAIL_SERVER_PASSWORD!,
    },
  });
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
  const html = `
  <div style="font-family:Inter,system-ui,-apple-system;line-height:1.55;color:#111">
    <h2 style="margin:0 0 12px">Dziękujemy za rejestrację w ZORY!</h2>
    <p>Cześć ${name ? `<strong>${name}</strong>` : "Projektantko/Projektancie"}, miło Cię widzieć w naszej społeczności.</p>
    <p>Możesz już zalogować się do panelu projektanta i uzupełnić swój profil:</p>
    <p>
      <a href="${process.env.NEXTAUTH_URL}api/auth/signin"
         style="display:inline-block;padding:10px 16px;background:#000;color:#fff;border-radius:10px;text-decoration:none">
        Przejdź do logowania
      </a>
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:18px 0">
    <p style="font-size:13px;color:#555;margin:0">
      Jeśli to nie Ty zakładałeś konto, zignoruj tę wiadomość.
    </p>
  </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Witaj w ZORY — dziękujemy za rejestrację",
    html,
    headers: { "X-Transactional-Tag": "welcome" }, // optional tagging
  });
}