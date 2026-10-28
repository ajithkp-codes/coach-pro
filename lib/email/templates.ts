import "server-only";

/**
 * Email bodies for the app-sent messages (welcome + admin signup alert).
 * Plain, inline-styled HTML (email clients strip <style>/external CSS) with a
 * text fallback. Brand accent is the CoachPro vermilion.
 */

const ACCENT = "#e0481f";
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://coachpro.co.in";

function shell(heading: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  return `
  <div style="margin:0;padding:24px;background:#faf8f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #ece7e1;border-radius:14px;overflow:hidden;">
      <div style="padding:20px 28px;border-bottom:1px solid #f0ebe4;">
        <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;">Coach<span style="color:${ACCENT};">Pro</span></span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;">${heading}</h1>
        ${bodyHtml}
        ${
          cta
            ? `<div style="margin-top:24px;">
                 <a href="${cta.href}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px;">${cta.label}</a>
               </div>`
            : ""
        }
      </div>
      <div style="padding:16px 28px;border-top:1px solid #f0ebe4;color:#8a8279;font-size:12px;">
        CoachPro · Sent from ajith@coachpro.co.in
      </div>
    </div>
  </div>`;
}

export function welcomeEmail(fullName: string | null): { subject: string; html: string; text: string } {
  const first = (fullName || "").split(" ")[0];
  const greeting = first ? `Welcome aboard, ${first}!` : "Welcome aboard!";
  const dash = `${siteUrl()}/dashboard`;
  return {
    subject: "Welcome to CoachPro 🎉",
    html: shell(
      greeting,
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4a4540;">
         Your email is verified and your CoachPro account is ready. You can sign in anytime
         with the email and password you just created.
       </p>
       <p style="margin:0;font-size:14px;line-height:1.6;color:#4a4540;">
         Add your first client, build a training or nutrition plan, and start tracking progress —
         everything lives in your dashboard.
       </p>`,
      { label: "Go to my dashboard", href: dash },
    ),
    text: `${greeting}\n\nYour email is verified and your CoachPro account is ready. You can sign in anytime with the email and password you just created.\n\nGo to your dashboard: ${dash}\n\n— CoachPro`,
  };
}

export function adminSignupAlertEmail(trainer: {
  fullName: string | null;
  email: string | null;
  businessName: string | null;
}): { subject: string; html: string; text: string } {
  const name = trainer.fullName || "Unnamed trainer";
  const rows = [
    ["Name", name],
    ["Email", trainer.email || "—"],
    ["Business", trainer.businessName || "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#8a8279;font-size:13px;">${k}</td><td style="padding:4px 0;font-size:13px;font-weight:600;">${v}</td></tr>`,
    )
    .join("");
  const admin = `${siteUrl()}/admin/trainers`;
  return {
    subject: `New CoachPro signup: ${name}`,
    html: shell(
      "A new trainer just signed up",
      `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#4a4540;">
         A new account was created and email-verified.
       </p>
       <table style="border-collapse:collapse;">${rows}</table>`,
      { label: "Open admin · Trainers", href: admin },
    ),
    text: `A new trainer just signed up and verified their email.\n\nName: ${name}\nEmail: ${trainer.email || "—"}\nBusiness: ${trainer.businessName || "—"}\n\nManage: ${admin}`,
  };
}
