import "server-only";

import { EMAIL_IDENTITIES } from "@/config/email";
import { buildLoadiqEmailContent } from "@/lib/email-template";
import { ELEVATED_ADMIN_EMAIL } from "@/lib/admin/elevated-auth";

type AdminEmailInput = {
  subject: string;
  text: string;
};

function getNoReplyEmail() {
  return process.env.NO_REPLY_EMAIL ?? EMAIL_IDENTITIES.authSystem.address;
}

function getResendApiKey() {
  return process.env.RESEND_API_KEY;
}

export async function sendAdminEmail({ subject, text }: AdminEmailInput) {
  const apiKey = getResendApiKey();
  const fromEmail = getNoReplyEmail();

  if (!apiKey) {
    console.error("ADMIN_EMAIL_SEND_FAILED: missing Resend configuration");
    return { ok: false as const, error: "Email delivery is unavailable." };
  }

  try {
    const emailContent = buildLoadiqEmailContent({
      channelKey: "auth_system",
      subject,
      text,
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Karpilo LoadIQ <${fromEmail}>`,
        to: [ELEVATED_ADMIN_EMAIL],
        reply_to: EMAIL_IDENTITIES.authSystem.replyTo,
        subject,
        text: emailContent.text,
        html: emailContent.html,
      }),
    });

    if (!response.ok) {
      console.error("ADMIN_EMAIL_SEND_FAILED:", response.status);
      return { ok: false as const, error: "Email delivery failed." };
    }

    return { ok: true as const };
  } catch {
    console.error("ADMIN_EMAIL_SEND_FAILED");
    return { ok: false as const, error: "Email delivery failed." };
  }
}

export function buildChallengeEmail(challenge: string, expiresAt: string) {
  return {
    subject: "Karpilo LoadIQ elevated admin challenge",
    text: [
      "Karpilo LoadIQ elevated admin challenge",
      "",
      `Challenge: ${challenge}`,
      `Expires: ${expiresAt}`,
      "",
      "If you did not request elevated admin access, ignore this email and review admin audit events.",
    ].join("\n"),
  };
}

export function buildTokenEmail(token: string, expiresAt: string) {
  return {
    subject: "Karpilo LoadIQ elevated admin token",
    text: [
      "Karpilo LoadIQ elevated admin token",
      "",
      `Token: ${token}`,
      `Expires: ${expiresAt}`,
      "",
      "This token is short-lived. If you did not request elevated admin access, ignore this email and review admin audit events.",
    ].join("\n"),
  };
}
