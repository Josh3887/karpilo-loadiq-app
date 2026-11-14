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
