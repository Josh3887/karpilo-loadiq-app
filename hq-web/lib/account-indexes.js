// Karpilo LoadIQ HQ Version 1: canonical account-holder indexes.
// This module deliberately contains no database credentials and never mutates customer data.
export const ACCOUNT_INDEXES = Object.freeze({
  subscribers:{source:"users + subscriptions + entitlements",key:"user_id",status:["active","pending","suspended","deletion_requested","closed"]},
  addressBook:{source:"account address book (schema verification pending)",key:"user_id",status:["active","unverified","archived"]},
  vehicleProfiles:{source:"truck_profiles",key:"user_id",status:["active","inactive","archived"]},
  expenseProfiles:{source:"user_overhead_items",key:"user_id",status:["active","inactive"]},
  profitProfiles:{source:"operator_profiles + user_settings + saved_loads",key:"user_id",status:["current","historical"]},
  loadLifecycle:{source:"saved_loads",key:"user_id",status:["planned","running","completed","rejected"]},
  websiteReservations:{source:"website_reservations",key:"reservation_id",status:["submitted","approved","declined"]},
  supportCases:{source:"support_intake + contact_inquiries",key:"case_id",status:["open","pending","investigating","closed"]},
  newsletterConsent:{source:"newsletter_subscribers",key:"subscriber_id",status:["subscribed","unsubscribed"]},
  deletionRequests:{source:"account_deletion_requests",key:"request_id",status:["open","in_review","completed"]},
});
export function normalizeLoadStatus(value) {
  if(value==="running"||value==="booked"||value==="dispatched")return "running";
  if(value==="completed"||value==="ran")return "completed";
  if(value==="rejected"||value==="pulled")return "rejected";
  return "planned";
}
export function accountIndexCoverage(source) {
  const record=ACCOUNT_INDEXES[source];
  if(!record)return null;
  return {name:source,source:record.source,joinKey:record.key,allowedStatuses:record.status,connection:"pending",recordCount:null,lastVerifiedAt:null};
}
