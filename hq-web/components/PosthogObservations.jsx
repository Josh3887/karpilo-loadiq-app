export default function PosthogObservations({data}){
 return <section className="panel"><h2>PostHog · Project and analytics inventory</h2>
 <p className="muted">{data?.reason||'Loading read-only PostHog observations.'}</p>
 <div className="item"><strong>PostHog API</strong><span className={'state '+(data?.status||'loading')}>{data?.status||'loading'}</span></div>
 {Object.entries(data?.coverage||{}).map(([scope,status])=><div className="item" key={scope}><span>{scope}</span><span className={'state '+status}>{status}</span></div>)}
 {data?.project&&<><h3>{data.project.name} · {data.project.id}</h3><p className="muted">Project timezone: {data.project.timezone||'Unknown'}</p><p>{data.project.ingestedEvent===false?'PostHog reports no events received yet.':data.project.ingestedEvent===true?'PostHog reports that this project has received events. This does not verify current ingestion health.':'Event ingestion state unavailable.'}</p></>}
 {[['dashboards','Dashboards'],['insights','Saved insights']].map(([key,label])=><div key={key}><h3>{label}</h3>{data?.[key]?.length?data[key].map(i=><div className="item" key={i.id}><strong>{i.name}</strong><span>ID {i.id}</span></div>):<p className="empty">{data?.[key]?'No '+label.toLowerCase()+' returned.':label+' unavailable.'}</p>}{data?.pagination?.[key]&&<p className="muted">Additional {label.toLowerCase()} exist beyond this first page.</p>}</div>)}
 </section>;
}
