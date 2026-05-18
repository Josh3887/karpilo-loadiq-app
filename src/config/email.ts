export const EMAIL_ADDRESSES = {
  support: "support@karpiloloadiq.com",
  billing: "billing@karpiloloadiq.com",
  executive: "j.karpilo@karpiloloadiq.com",
  noReply: "noreply@karpiloloadiq.com",
  newsletter: "newsletter@karpiloloadiq.com",
  security: "security@karpiloloadiq.com",
  notifications: "notifications@karpiloloadiq.com",
} as const;

export const EMAIL_IDENTITIES = {
  support: {
    address: EMAIL_ADDRESSES.support,
    replyTo: EMAIL_ADDRESSES.support,
    role: "customer_support",
    provider: "google_workspace",
  },
  billing: {
    address: EMAIL_ADDRESSES.billing,
    replyTo: EMAIL_ADDRESSES.billing,
    role: "billing_support",
    provider: "google_workspace",
  },
  executive: {
    address: EMAIL_ADDRESSES.executive,
    replyTo: EMAIL_ADDRESSES.executive,
    role: "executive_owner",
    provider: "google_workspace",
  },
  authSystem: {
    address: EMAIL_ADDRESSES.noReply,
    replyTo: EMAIL_ADDRESSES.support,
    role: "auth_system",
    provider: "resend",
  },
  newsletter: {
    address: EMAIL_ADDRESSES.newsletter,
    replyTo: EMAIL_ADDRESSES.support,
    role: "newsletter_updates",
    provider: "resend",
  },
  security: {
    address: EMAIL_ADDRESSES.security,
    replyTo: EMAIL_ADDRESSES.support,
    role: "future_security_alerts",
    provider: "resend",
  },
  notifications: {
    address: EMAIL_ADDRESSES.notifications,
    replyTo: EMAIL_ADDRESSES.support,
    role: "future_app_notifications",
    provider: "resend",
  },
} as const;

export const EMAIL_CHANNEL_ALIASES = {
  updates: "newsletter",
} as const;
