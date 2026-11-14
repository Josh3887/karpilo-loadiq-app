// Feature control policy contract. No production controls are exposed by this file.
// Enforce these decisions in the AWS application API; UI labels are informational only.
export const FEATURE_STATES=Object.freeze(["closed","restricted","open","maintenance"]);
export const FEATURE_CATALOG=Object.freeze([
 {id:"calculator",name:"Load Profit Calculator",category:"Core"},
 {id:"saved_loads",name:"Saved Loads & Lifecycle",category:"Core"},
 {id:"vehicle_profiles",name:"Vehicle Profiles",category:"Profiles"},
 {id:"expense_profiles",name:"Expense Profiles",category:"Profiles"},
 {id:"profit_profiles",name:"Profit Profiles",category:"Profiles"},
 {id:"address_book",name:"Address Book",category:"Profiles"},
 {id:"google_address_validation",name:"Google Address Verification",category:"Integrations"},
 {id:"route_intelligence",name:"Route Intelligence",category:"Intelligence"},
 {id:"atlas",name:"Atlas Intelligence",category:"Intelligence"},
 {id:"market_intelligence",name:"Freight Market Intelligence",category:"Intelligence"},
 {id:"newsletter",name:"Newsletter",category:"Communications"},
 {id:"referrals",name:"Referral Program",category:"Growth"},
 {id:"subscription_checkout",name:"Subscription Checkout",category:"Billing"},
 {id:"new_enrollment",name:"New Account Enrollment",category:"Access"},
 {id:"account_activation",name:"Account Activation",category:"Access"}
]);
export const ELIGIBILITY_FIELDS=Object.freeze(["account_status","verified_email","subscription_status","entitlement","cohort","rollout_percentage","country","maintenance_window","dependency_health","usage_quota","budget_limit"]);
export function describeGate(gate){
 if(!gate||!FEATURE_STATES.includes(gate.state))return {effective:"closed",reason:"Missing or invalid gate configuration"};
 if(gate.state==="closed"||gate.state==="maintenance")return {effective:"closed",reason:gate.reason||gate.state};
 if(!gate.enforcementVerified)return {effective:"closed",reason:"AWS API enforcement not verified"};
 return {effective:gate.state,reason:gate.reason||"Eligibility must be checked server-side"};
}

export const BYPASS_TYPES=Object.freeze(["account_exception","cohort_exception","maintenance_operator","emergency_close","rollback"]);
export const NON_BYPASSABLE=Object.freeze(["authentication","authorization","account_ownership","data_isolation","legal_hold","verified_deletion","payment_processing_security"]);
export function evaluateFeatureGate({gate,account,exception,now=Date.now()}){
 const base=describeGate(gate);
 if(!account?.authenticated||!account?.authorized)return {allowed:false,reason:"Identity and authorization required",source:"security"};
 if(account?.suspended||account?.deletionRestricted)return {allowed:false,reason:"Account safety restriction",source:"security"};
 if(gate?.state==="open"&&gate.enforcementVerified&&account.entitled)return {allowed:true,reason:"Eligible account",source:"gate"};
 if(!exception)return {allowed:false,reason:base.reason,source:"gate"};
 if(!BYPASS_TYPES.includes(exception.type)||exception.type==="emergency_close")return {allowed:false,reason:"Exception cannot grant access",source:"exception"};
 if(exception.featureId!==gate?.featureId||exception.accountId!==account.id)return {allowed:false,reason:"Exception scope mismatch",source:"exception"};
 if(!exception.approved||!exception.enforcementVerified||exception.revokedAt||!Number.isFinite(Date.parse(exception.expiresAt))||Date.parse(exception.expiresAt)<=now)return {allowed:false,reason:"Exception not active and verified",source:"exception"};
 if(!exception.reason||!exception.auditId||!exception.approverId)return {allowed:false,reason:"Missing approval or audit evidence",source:"exception"};
 if(gate?.state==="maintenance"&&!exception.maintenanceSafe)return {allowed:false,reason:"Maintenance dependency unsafe",source:"gate"};
 if(gate?.state==="closed"&&!exception.allowClosed)return {allowed:false,reason:"Closed feature not authorized for exception",source:"gate"};
 return {allowed:true,reason:"Scoped, time-limited approved exception",source:"exception"};
}
