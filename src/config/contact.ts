import { LOADIQ_EMAILS } from "@/config/loadiq";

export const CONTACT_EMAILS = {
  noReply: LOADIQ_EMAILS.noReply,
  support: LOADIQ_EMAILS.support,
  newsletter: LOADIQ_EMAILS.newsletter,
  updates: LOADIQ_EMAILS.updates,
  billing: LOADIQ_EMAILS.billing,
  feedback: LOADIQ_EMAILS.feedback,
  founderFeedback: LOADIQ_EMAILS.founderFeedback,
  corporate: LOADIQ_EMAILS.corporate,
  legal: LOADIQ_EMAILS.legal,
} as const;
