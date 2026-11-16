'use client';
import {previewDocument} from '../lib/mail-preview.mjs';
import TemplateEditor from './TemplateEditor';
import {useEffect,useMemo,useRef,useState} from 'react';
import {fillTemplate,publicationLabel,sendBlocker,templateCategory,variableValues} from '../lib/resend-templates.mjs';
export default function CommunicationsTemplates({refresh=0,initialTemplate=null,onLibrary}){
 const [rows,setRows]=useState([]),[next,setNext]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [query,setQuery]=useState(''),[category,setCategory]=useState('All templates'),[publication,setPublication]=useState('all');
 const [selected,setSelected]=useState(initialTemplate),[detail,setDetail]=useState(null),[detailLoading,setDetailLoading]=useState(false),[detailError,setDetailError]=useState(''),[revision,setRevision]=useState(0);
 const [values,setValues]=useState({}),[composing,setComposing]=useState(false),[to,setTo]=useState(''),[review,setReview]=useState(false),[confirmed,setConfirmed]=useState(false),[sending,setSending]=useState(false),[receipt,setReceipt]=useState(null),[view,setView]=useState('desktop');
 const [editing,setEditing]=useState(false),[editNotice,setEditNotice]=useState(''),[attachments,setAttachments]=useState([]),[attachmentError,setAttachmentError]=useState(''),[readingFiles,setReadingFiles]=useState(false);
 const generation=useRef(0),requestId=useRef(null),sendLock=useRef(false);
 useEffect(()=>{if(initialTemplate)setSelected(initialTemplate)},[initialTemplate]);
 useEffect(()=>{
  let active=true;generation.current++;setLoading(true);setError('');setRows([]);setNext(null);
  fetch('/api/resend/templates',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(!active)return;if(d.status!=='connected')throw Error(d.reason||'Templates unavailable.');setRows(d.templates);setNext(d.nextCursor);}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[refresh]);
 async function more(){
  const gen=generation.current;setLoading(true);setError('');
  try{const d=await fetch('/api/resend/templates?after='+encodeURIComponent(next),{cache:'no-store'}).then(r=>r.json());if(gen!==generation.current)return;if(d.status!=='connected')throw Error(d.reason||'Templates unavailable.');setRows(old=>[...new Map([...old,...d.templates].map(t=>[t.id,t])).values()]);setNext(d.nextCursor)}catch(e){if(gen===generation.current)setError(e.message)}finally{if(gen===generation.current)setLoading(false)}
 }
 useEffect(()=>{
  if(!selected)return;let active=true;setEditing(false);setAttachments([]);setAttachmentError('');setDetail(null);setDetailError('');setDetailLoading(true);setValues({});setComposing(false);setReview(false);setConfirmed(false);setReceipt(null);requestId.current=null;
  fetch('/api/resend/templates?id='+encodeURIComponent(selected),{cache:'no-store'}).then(r=>r.json()).then(d=>{if(!active)return;if(d.status!=='connected')throw Error(d.reason||'Template unavailable.');setDetail(d.template);}).catch(e=>{if(active)setDetailError(e.message)}).finally(()=>{if(active)setDetailLoading(false)});
  return()=>{active=false};
 },[selected,refresh,revision]);
 const categories=['All templates',...new Set(rows.map(templateCategory))];
 const filtered=rows.filter(t=>(category==='All templates'||templateCategory(t)===category)&&(publication==='all'||(publication==='published'?t.status==='published':t.status!=='published'))&&(t.name+' '+(t.alias||'')).toLowerCase().includes(query.toLowerCase()));
 const resolved=useMemo(()=>detail?variableValues(detail,values):{values:{},missing:[]},[detail,values]);
 const subject=detail?fillTemplate(detail.subject,resolved.values):'';
 const html=useMemo(()=>detail?previewDocument(fillTemplate(detail.html,resolved.values,true)):'',[detail,resolved]);
 const blocked=detail?sendBlocker(detail):null;
 function editValue(key,value){setValues(v=>({...v,[key]:value}));setReview(false);setConfirmed(false);setReceipt(null);requestId.current=null;}
 async function chooseFiles(e){
  const files=[...e.target.files];e.target.value='';setAttachmentError('');setReview(false);setConfirmed(false);requestId.current=null;
  if(files.length>5||files.reduce((n,f)=>n+f.size,0)>2*1024*1024){setAttachmentError('Choose up to five files, 2 MB combined.');setAttachments([]);return;}
  if(files.some(f=>! /\.(pdf|png|jpe?g|gif|webp|txt|csv|docx|xlsx)$/i.test(f.name))){setAttachmentError('Use PDF, images, text, CSV, DOCX or XLSX.');setAttachments([]);return;}
  setReadingFiles(true);try{const items=await Promise.all(files.map(f=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve({filename:f.name,content:String(reader.result).split(',')[1],size:f.size});reader.readAsDataURL(f)})));setAttachments(items);}catch{setAttachmentError('Unable to read selected files.');setAttachments([]);}finally{setReadingFiles(false);}
 }
 function beginReview(e){e.preventDefault();requestId.current??=crypto.randomUUID();setReview(true);setConfirmed(false);setReceipt(null);}
 async function send(){
  if(sendLock.current||!confirmed||!detail)return;sendLock.current=true;setSending(true);
  try{const d=await fetch('/api/resend/send-template',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({templateId:detail.id,version:detail.version,to,variables:resolved.values,requestId:requestId.current,confirmed:true,attachments})}).then(r=>r.json());setReceipt(d)}catch{setReceipt({status:'unknown',reason:'The response was interrupted. Retry this same message or check delivery history.'})}finally{setSending(false);sendLock.current=false;}
 }
 return <section className="panel template-workspace">
  <div className="template-heading"><div><span className="eyebrow">RESEND · REUSABLE EMAILS</span><h2>Communications templates</h2><p className="muted">Choose a template, personalize a message and review it before sending.</p></div><button className="refresh" onClick={onLibrary}>Delivery history</button></div>
  <div className="template-stats"><span><strong>{rows.length}</strong> templates loaded</span><span><strong>{rows.filter(t=>t.status==='published').length}</strong> published</span><span><strong>{rows.filter(t=>t.status!=='published').length}</strong> unpublished</span><span>{next?'More templates available':'Reusable originals stay in Resend'}</span></div>
  <p className="muted">Publication is read directly from Resend. Unpublished means the reusable template has not been released for sending; it is not a message draft. Select a template to see its publication timestamp. Superseded originals remain labeled separately.</p><div className="template-layout"><div className="template-browser">
   <label className="template-label">Find a template<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or alias"/></label>
   <div className="template-filter-row"><label className="template-label">Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="template-label">Publication<select value={publication} onChange={e=>setPublication(e.target.value)}><option value="all">All states</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></label></div>
   <small className="muted">Categories are assigned by HQ from template names.</small>
   {error&&<p role="alert" className="template-notice">{error}</p>}
   <div className="template-list" aria-label="Email templates">{filtered.map(t=><button disabled={sending} className={'template-card '+(selected===t.id?'selected':'')} key={t.id} onClick={()=>setSelected(t.id)} aria-pressed={selected===t.id}><span className="template-card-top"><span>{templateCategory(t)}</span><span className={'state '+(t.status==='published'?'connected':'unconfigured')}>{publicationLabel(t.status)}</span></span><strong>{t.name}</strong><small>{t.alias||'No alias'}</small></button>)}</div>
   {loading&&<p role="status">Loading templates…</p>}{!loading&&!error&&!filtered.length&&<p className="empty">No templates match these filters.</p>}{next&&<button className="refresh" onClick={more} disabled={loading}>Load more templates</button>}
  </div><div className="template-detail" aria-live="polite">
   {!selected&&<div className="template-empty"><span className="eyebrow">YOUR EMAIL LIBRARY</span><h3>Select a reusable template</h3><p>Preview the original design, fill its variables and use it for an individual message.</p></div>}
   {detailLoading&&<p role="status">Loading template content…</p>}{detailError&&<div role="alert"><p>{detailError}</p><button className="refresh" onClick={()=>setRevision(x=>x+1)}>Retry template</button></div>}
   {detail&&<><div className="template-heading"><div><h3>{detail.name}</h3><span className={'state '+(detail.status==='published'?'connected':'unconfigured')}>{publicationLabel(detail.status)} template</span></div><a href={'https://resend.com/templates/'+encodeURIComponent(detail.id)} target="_blank" rel="noreferrer">Open in Resend ↗</a></div>
    <dl className="template-meta"><div><dt>From</dt><dd>{detail.from||'Not set'}</dd></div><div><dt>Reply to</dt><dd>{Array.isArray(detail.replyTo)?detail.replyTo.join(', '):detail.replyTo||'Sender address'}</dd></div><div><dt>Subject</dt><dd>{subject||'Not set'}</dd></div></dl>
    <p className="muted">Published: {detail.publishedAt?new Date(detail.publishedAt).toLocaleString():'Never published'} · {detail.hasUnpublishedVersions?'Unpublished revision exists':'No unpublished revision reported'}</p>
    {editNotice&&<p role="status" className="template-notice">{editNotice}</p>}
    {!editing&&<button className="refresh" disabled={sending||!detail.version||templateCategory(detail)==='Superseded'} onClick={()=>{setEditing(true);setComposing(false);setReview(false);setEditNotice('')}}>Edit template</button>}
    {editing&&<TemplateEditor key={detail.version} template={detail} onCancel={()=>setEditing(false)} onSaved={notice=>{setEditNotice(notice);setRevision(x=>x+1)}}/>}
    {!composing&&!editing&&<button className="template-primary" disabled={templateCategory(detail)==='Superseded'} onClick={()=>{setComposing(true);setReceipt(null)}}>Use template</button>}
    {blocked&&<p className="template-notice">{blocked}</p>}
    {composing&&<form className="template-composer" onSubmit={beginReview}>
     <h3>Message from this template</h3><p className="muted">Personalization applies to this message. The reusable template stays unchanged.</p>
     <fieldset disabled={sending||receipt?.status==='accepted'||review}><label className="template-label">Recipient<input type="email" required maxLength={254} value={to} onChange={e=>{setTo(e.target.value.trim());setReceipt(null);requestId.current=null}} placeholder="recipient@example.com"/></label>
     <div className="template-variable-grid">{detail.variables.map(v=><label className="template-label" key={v.key}>{v.key}<small>{v.fallback!==null?'Default: '+v.fallback:'Required'} · {v.type}</small><input type={v.type==='number'?'number':'text'} step={v.type==='number'?'any':undefined} required={v.fallback===null} maxLength={2000} value={values[v.key]??''} placeholder={v.fallback===null?'Enter '+v.key:String(v.fallback)} onChange={e=>editValue(v.key,e.target.value)}/></label>)}</div><label className="template-label">Attach files or images<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.docx,.xlsx" onChange={chooseFiles}/><small>Up to five files, 2 MB combined. Files stay in this browser until you send.</small></label>{readingFiles&&<p>Reading files…</p>}{attachmentError&&<p role="alert">{attachmentError}</p>}{attachments.map((a,i)=><div className="item" key={i}><span>{a.filename} · {Math.ceil(a.size/1024)} KB</span><button type="button" onClick={()=>{setAttachments(items=>items.filter((_,j)=>i!==j));requestId.current=null}}>Remove</button></div>)}</fieldset>
     {!detail.variables.length&&<p className="muted">This template has no personalization fields.</p>}
     {resolved.missing.length>0&&<p className="muted">{resolved.missing.length} required fields remaining.</p>}
     {!review&&<button className="template-primary" type="submit" disabled={readingFiles||Boolean(attachmentError)||Boolean(blocked)||resolved.missing.length>0||!detail.from||!detail.subject||!detail.version}>Review message</button>}
    </form>}
    {review&&<div className="template-review"><h3>Review delivery</h3><p><strong>To:</strong> {to}</p><p><strong>From:</strong> {detail.from}</p><p><strong>Subject:</strong> {subject}</p><p>Attachments: {attachments.length?attachments.map(a=>a.filename).join(", "):"None"}</p><p>This sends one real email through Resend.</p><label className="template-confirm"><input type="checkbox" checked={confirmed} disabled={sending||receipt?.status==='accepted'} onChange={e=>setConfirmed(e.target.checked)}/>I reviewed the recipient, content and any payment, account or other event described in this message.</label><div className="chips"><button disabled={sending||receipt?.status==='accepted'} onClick={()=>{setReview(false);setConfirmed(false)}}>Edit message</button><button className="template-primary" disabled={!confirmed||sending||receipt?.status==='accepted'} onClick={send}>{sending?'Sending…':receipt?.status==='accepted'?'Accepted by Resend':receipt?.status==='unknown'?'Retry same message':'Send email'}</button></div></div>}
    {receipt&&<p role="status" className="template-notice">{receipt.reason}{receipt.id&&<> Message reference: {receipt.id}</>}</p>}
    <div className="template-preview-toolbar"><h3>Email preview</h3><div className="chips">{['desktop','mobile','text'].map(mode=><button key={mode} className={view===mode?'selected':''} onClick={()=>setView(mode)}>{mode}</button>)}</div></div>
    <p className="muted">{resolved.missing.length?'Unfilled fields remain visible as placeholders. ':''}Preview links are inactive. Images use the existing Karpilo image host.</p>
    {view==='text'?<pre className="template-text">{fillTemplate(detail.text,resolved.values)||'No plain-text version provided.'}</pre>:<div className={'template-preview '+view}><iframe title={'Email preview: '+detail.name} sandbox="" referrerPolicy="no-referrer" srcDoc={html}/></div>}
   </>}
  </div></div>
 </section>;
}
