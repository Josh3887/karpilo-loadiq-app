export default function SentryObservations({data}){
 return <section className="panel"><h2>Sentry · Projects and unresolved issues</h2>
 <p className="muted">{data?.reason||'Loading read-only Sentry observations.'}</p>
 <div className="item"><strong>Sentry API</strong><span className={'state '+(data?.status||'loading')}>{data?.status||'loading'}</span></div>
 {Object.entries(data?.coverage||{}).map(([scope,status])=><div className="item" key={scope}><span>{scope}</span><span className={'state '+status}>{status}</span></div>)}
 <h3>Projects</h3>{data?.projects?.length?data.projects.map(p=><div className="item" key={p.id}><strong>{p.slug}</strong><span>{p.platform||'Platform unavailable'}</span></div>):<p className="empty">{data?.projects?'No projects returned.':'Project inventory unavailable.'}</p>}
 {data?.pagination?.projects&&<p className="muted">Additional projects exist beyond this first page.</p>}
 <h3>Unresolved issues · last 14 days · all environments</h3>{data?.issues?.length?data.issues.map(i=><div className="item" key={i.id}><span><a href={i.url} target="_blank" rel="noopener noreferrer">{i.shortId}</a><small style={{display:'block'}}>{i.project} · {i.level} · {i.status}</small><small style={{display:'block'}}>Last seen: {i.lastSeen?new Date(i.lastSeen).toLocaleString():'Unavailable'}</small></span><span>{i.count??'Unknown'} events</span></div>):<p className="empty">{data?.issues?'No unresolved issues returned for this window.':'Issue inventory unavailable.'}</p>}
 {data?.pagination?.issues&&<p className="muted">Additional matching issues exist beyond this first page.</p>}
 </section>;
}
