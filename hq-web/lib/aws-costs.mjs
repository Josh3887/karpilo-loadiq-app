// Fixed product allocation; never fall back to unfiltered account totals.
export const allocationFilter={Or:[
 {Tags:{Key:'Project',Values:['KarpiloLoadIQ','Karpilo LoadIQ']}},
 {Tags:{Key:'Application',Values:['LoadIQ-HQ','KarpiloLoadIQHQ']}},
 {Tags:{Key:'application',Values:['loadiq-hq']}},
 {Tags:{Key:'aws:ecs:clusterName',Values:['karpilo-isolated-test']}}
]};
export function costRequest(now=new Date()){
 const end=now.toISOString().slice(0,10),start=end.slice(0,7)+'-01';
 return {TimePeriod:{Start:start,End:end},Granularity:'DAILY',Metrics:['UnblendedCost'],Filter:allocationFilter,GroupBy:[{Type:'DIMENSION',Key:'SERVICE'}]};
}
export function normalizeCosts(result,request,now=new Date()){
 const base={checkedAt:now.toISOString(),scope:'Tagged LoadIQ resources only',window:request.TimePeriod,currency:'USD',total:null,series:[],services:[],coverage:'partial',estimated:true};
 if(result.NextPageToken)return {...base,status:'partial',reason:'AWS returned additional billing pages. No incomplete total is displayed.'};
 if(!Array.isArray(result.ResultsByTime))return {...base,status:'unavailable',reason:'AWS billing response could not be validated.'};
 const services=new Map(),daily=[];
 for(const day of result.ResultsByTime){
  if(!Array.isArray(day.Groups)||!/^\d{4}-\d{2}-\d{2}$/.test(day.TimePeriod?.Start||''))return {...base,status:'unavailable',reason:'AWS billing dates or groups could not be validated.'};
  let total=0;
  for(const group of day.Groups){
   const m=group.Metrics?.UnblendedCost,v=Number(m?.Amount);
   if(m?.Unit!=='USD'||typeof m.Amount!=='string'||!m.Amount.trim()||!Number.isFinite(v)||!group.Keys?.[0])return {...base,status:'unavailable',reason:'AWS billing amounts or currency could not be validated.'};
   total+=v;services.set(group.Keys[0],(services.get(group.Keys[0])||0)+v);
  }
  if(day.Groups.length)daily.push({time:day.TimePeriod.Start,value:total});
 }
 if(!daily.length)return {...base,status:'connected-empty',reason:'AWS billing access works, but no charges match the LoadIQ allocation tags yet. This is not a verified $0 bill. Cost allocation can lag; untagged resources and shared credits are excluded.'};
 return {...base,status:'connected',estimated:result.ResultsByTime.some(d=>d.Estimated),total:daily.reduce((n,p)=>n+p.value,0),services:[...services].map(([name,value])=>({name,value})),series:[{name:'Tagged AWS daily cost',unit:'USD',points:daily,description:'Month to date, complete UTC days. Unblended cost for matching tags only; untagged resources and unallocated credits are excluded.'}],reason:'Partial product attribution: tagged resources only, not the full LoadIQ bill or remaining grant balance. Current-month AWS charges may be estimated.'};
}
