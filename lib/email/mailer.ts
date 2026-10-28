import "server-only";
import nodemailer from "nodemailer";

/**
 * App-sent transactional email (welcome message, admin signup alerts) via the
 * CoachPro mailbox on Titan (GoDaddy). This is SEPARATE from Supabase's own auth
 * emails (confirm link, password reset) — those are sent by Supabase using the
 * custom SMTP you configure in the Supabase dashboard with the SAME Titan creds.
 *
 * All SMTP settings are server-only env vars (never NEXT_PUBLIC). If they are not
 * set, sending is a no-op so signup/login never breaks in a half-configured env.
 */

const FROM = process.env.MAIL_FROM || "CoachPro <ajith@coachpro.co.in>";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user, pass },
  });
}

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Fire-and-forget safe: resolves even if SMTP is unset or the send fails. */
export async function sendMail(mail: Mail): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.warn(`[mailer] SMTP not configured — skipped email "${mail.subject}" to ${mail.to}`);
    return false;
  }
  try {
    await transport.sendMail({ from: FROM, ...mail });
    return true;
  } catch (err) {
    console.error(`[mailer] failed to send "${mail.subject}" to ${mail.to}:`, err);
    return false;
  }
}
