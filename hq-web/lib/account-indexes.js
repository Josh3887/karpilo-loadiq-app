// Karpilo LoadIQ HQ Version 1: canonical account-holder indexes.
// This module deliberately contains no database credentials and never mutates customer data.
export const ACCOUNT_INDEXES = Object.freeze({
  subscribers:{source:"AWS RDS PostgreSQL: account + subscription + entitlement schema verification pending",key:"user_id",status:["active","pending","suspended","deletion_requested","closed"]},
  addressBook:{source:"AWS RDS PostgreSQL: address book schema verification pending",key:"user_id",status:["active","unverified","archived"]},
  vehicleProfiles:{source:"AWS RDS PostgreSQL: vehicle profile schema verification pending",key:"user_id",status:["active","inactive","archived"]},
  expenseProfiles:{source:"AWS RDS PostgreSQL: expense profile schema verification pending",key:"user_id",status:["active","inactive"]},
  profitProfiles:{source:"AWS RDS PostgreSQL: profit profile and load snapshot schema verification pending",key:"user_id",status:["current","historical"]},
  loadLifecycle:{source:"AWS RDS PostgreSQL: load lifecycle schema verification pending",key:"user_id",status:["planned","running","completed","rejected"]},
  websiteReservations:{source:"AWS RDS PostgreSQL or verified website intake API",key:"reservation_id",status:["submitted","approved","declined"]},
  supportCases:{source:"Verified website intake APIs and mail provider",key:"case_id",status:["open","pending","investigating","closed"]},
  newsletterConsent:{source:"Verified newsletter consent source",key:"subscriber_id",status:["subscribed","unsubscribed"]},
  deletionRequests:{source:"Verified deletion workflow source",key:"request_id",status:["open","in_review","completed"]},
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
