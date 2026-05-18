import { EMAIL_IDENTITIES } from "@/config/email";

type BrandedEmailInput = {
  channelKey: string;
  subject: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textBlocksToHtml(text: string) {
  return text
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />");

      return `<p style="margin:0 0 16px;line-height:1.6;color:#dbeafe;">${lines}</p>`;
    })
    .join("");
}

export function buildLoadiqEmailContent({
  channelKey,
  subject,
  text,
}: BrandedEmailInput) {
  const normalizedText = text.trim();
  const label = channelKey === "auth_system" ? "System" : "Karpilo LoadIQ";
  const footerText = [
    "",
    "--",
    "Karpilo LoadIQ",
    `Support: ${EMAIL_IDENTITIES.support.replyTo}`,
    `Billing: ${EMAIL_IDENTITIES.billing.replyTo}`,
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#020617;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <div style="margin:0 auto;max-width:680px;border:1px solid rgba(56,189,248,0.24);border-radius:18px;overflow:hidden;background:#0b1220;">
      <div style="padding:22px 26px;border-bottom:1px solid rgba(148,163,184,0.18);background:linear-gradient(135deg,rgba(56,189,248,0.16),rgba(239,68,68,0.08));">
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#7dd3fc;font-weight:700;">${escapeHtml(label)}</div>
        <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;color:#f8fafc;">${escapeHtml(subject)}</h1>
      </div>
      <div style="padding:26px;">
        ${textBlocksToHtml(normalizedText)}
      </div>
      <div style="padding:20px 26px;border-top:1px solid rgba(148,163,184,0.18);background:#060b14;">
        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#94a3b8;">Karpilo LoadIQ</p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
          Support: ${escapeHtml(EMAIL_IDENTITIES.support.replyTo)}<br />
          Billing: ${escapeHtml(EMAIL_IDENTITIES.billing.replyTo)}
        </p>
      </div>
    </div>
  </body>
</html>`;

  return {
    text: `${normalizedText}${footerText}`,
    html,
  };
}
