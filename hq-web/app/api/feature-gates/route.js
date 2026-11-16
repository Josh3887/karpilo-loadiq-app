import {NextResponse} from "next/server";
import {FEATURE_CATALOG,FEATURE_STATES,ELIGIBILITY_FIELDS} from "../../../lib/feature-gates.js";
export const dynamic="force-dynamic";
export async function GET(){
 return NextResponse.json({
  mode:"design-only",enforcement:"not-connected",states:FEATURE_STATES,
  eligibilityFields:ELIGIBILITY_FIELDS,
  features:FEATURE_CATALOG.map(f=>({...f,configuredState:null,effectiveState:"closed",reason:"AWS gate enforcement not connected"})),
  message:"Read-only registry. Feature changes must be audited, authorized and enforced by AWS backend; no public write API exists."
 },{headers:{"Cache-Control":"private, no-store"}});
}
