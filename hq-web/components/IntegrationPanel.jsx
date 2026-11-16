'use client';
import {useState} from 'react';
const badges={AWS:'AWS',GitHub:'GH',Vercel:'V',Resend:'RE',Twilio:'TW',PostHog:'PH',Sentry:'SE',Cloudflare:'CF',Redis:'RD','Google Maps Platform':'GM','Gemini / Google':'AI',EIA:'EIA',Termly:'TL',Stripe:'ST','Gmail / Workspace':'GW','Private Network / VPN':'VPN'};
const attention=new Set(['error','unavailable','access-denied','rate-limited','partial']);
const stamp=x=>x?new Date(x).toLocaleString():'Not checked';
export default function IntegrationPanel({entries,awsOperations,posthog,sentry,resend,twilio,onOpen,overview=false}){
 const [filter,setFilter]=useState('All');
 const rows=entries.filter(p=>filter==='All'||filter==='Connected'&&p.status==='connected'||filter==='Attention'&&attention.has(p.status)||filter==='Setup'&&!['connected','loading'].includes(p.status)&&!attention.has(p.status));
 return <>
 <section className="panel integration-panel"><div className="section-title"><div><span className="eyebrow">CONNECTED INFRASTRUCTURE</span><h2>Integration control panel</h2></div><span className="muted">{entries.length} services</span></div><div className="chips" aria-label="Filter integrations">{['All','Connected','Attention','Setup'].map(f=><button key={f} aria-pressed={filter===f} className={filter===f?'selected':''} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="integration-grid">{rows.map(p=><article className={'integration-card '+(attention.has(p.status)?'needs-attention':'')} key={p.name}><div className="integration-card-top"><span className="provider-monogram" aria-hidden="true">{badges[p.name]||p.name.slice(0,2)}</span><span className={'state '+p.status}>{p.status==='connected'?'API connected':p.status.replaceAll('-',' ')}</span></div><h3>{p.name}</h3><p>{p.usageCategory||p.reason||'Read-only provider observations'}</p>{p.name==='Stripe'&&<span className="scope-note">TEST MODE ONLY</span>}{p.name==='PostHog'&&<span className="scope-note">CAPTURE DEFERRED · V1 INTERFACE</span>}<small>Checked {stamp(p.checkedAt)}</small><button onClick={()=>onOpen(p.name)}>View observations <span aria-hidden="true">↗</span></button></article>)}</div>{!rows.length&&<p className="empty">No services match this filter.</p>}</section>
 </>;
}
