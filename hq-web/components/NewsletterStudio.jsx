'use client';
import {useEffect,useState} from 'react';
import {Block,download,useDraft} from './HQWorkspaces';
import {newsletterHtml} from '../lib/newsletter.mjs';
import {previewDocument} from '../lib/mail-preview.mjs';
export default function NewsletterStudio(){
 const [draft,setDraft,save,saved]=useDraft('loadiq-hq-newsletter-v1',{title:'Karpilo LoadIQ newsletter',blocks:[{id:'title',type:'heading',text:'Drive the decision. Own the profit.'},{id:'body',type:'text',text:'Write your LoadIQ update here.'}],sourceHtml:''});
 const [templates,setTemplates]=useState([]),[cursor,setCursor]=useState(null),[notice,setNotice]=useState(''),[selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[preview,setPreview]=useState(''),[width,setWidth]=useState('100%');
 async function load(after){setBusy(true);try{const d=await fetch('/api/resend/templates'+(after?'?after='+encodeURIComponent(after):''),{cache:'no-store'}).then(r=>r.json());if(d.status!=='connected')throw Error(d.reason||'Template library unavailable');setTemplates(v=>after?[...v,...d.templates]:d.templates);setCursor(d.nextCursor)}catch(e){setNotice(e.message)}finally{setBusy(false)}}
 useEffect(()=>{load()},[]);
 const html=draft.sourceHtml||newsletterHtml(draft);
 useEffect(()=>{setPreview(previewDocument(html))},[html]);
 function update(id,field,value){setDraft({...draft,blocks:draft.blocks.map(b=>b.id===id?{...b,[field]:value}:b)})}
 function move(i,by){const blocks=[...draft.blocks],j=i+by;if(j<0||j>=blocks.length)return;[blocks[i],blocks[j]]=[blocks[j],blocks[i]];setDraft({...draft,blocks})}
 async function importTemplate(){if(!selected)return;setBusy(true);try{const d=await fetch('/api/resend/templates?id='+encodeURIComponent(selected),{cache:'no-store'}).then(r=>r.json());if(d.status!=='connected')throw Error(d.reason||'Template unavailable');setDraft({...draft,title:d.template.name,sourceHtml:d.template.html||''});setNotice('Template copied into this local design. The original and its publication state are unchanged.')}catch(e){setNotice(e.message)}finally{setBusy(false)}}
 return <>
<Block title="Newsletter design studio" kicker="COMPOSE · PREVIEW · EXPORT">
<p>Create an email with editable blocks, or copy an existing Resend template into the HTML editor. Retired originals remain retired and can be reused as design sources.</p>
<div className="workspace-toolbar">
<label>Design title<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/>
</label>
<button onClick={save}>Save local design</button>
<button onClick={()=>download('loadiq-newsletter.html',html,'text/html')}>Export HTML</button>
<button onClick={()=>download('loadiq-newsletter-design.json',draft)}>Export design</button>
</div>
<small>{saved?'Saved: '+saved:'Unsaved local design'} · Campaign scheduling and recipient delivery are not connected.</small>
<div className="workspace-toolbar">
<label>Resend design source<select value={selected} onChange={e=>setSelected(e.target.value)}>
<option value="">Choose a template</option>{templates.map(t=>
<option key={t.id} value={t.id}>{t.name} · {t.status}</option>)}</select>
</label>
<button disabled={!selected||busy} onClick={importTemplate}>Copy into HTML editor</button>{cursor&&<button disabled={busy} onClick={()=>load(cursor)}>Load more templates</button>}</div>{notice&&<p role="status">{notice}</p>}
</Block>
<div className="studio-layout">
<Block title="Design editor" kicker={draft.sourceHtml?'TEMPLATE HTML':'CONTENT BLOCKS'}>{draft.sourceHtml?<>
<label>Editable HTML<textarea className="studio-source" value={draft.sourceHtml} onChange={e=>setDraft({...draft,sourceHtml:e.target.value})}/>
</label>
<button onClick={()=>{download('loadiq-template-copy.html',draft.sourceHtml,'text/html');setDraft({...draft,sourceHtml:''})}}>Export template copy and return to blocks</button>
</>:<>
<div className="chips">{['heading','text','image','button','divider'].map(type=>
<button key={type} onClick={()=>setDraft({...draft,blocks:[...draft.blocks,{id:crypto.randomUUID(),type,text:type==='heading'?'Your heading':type==='text'?'Your message':type==='button'?'Learn more':'',url:''}]})}>+ {type}</button>)}</div>{draft.blocks.map((b,i)=>
<div className="studio-block" key={b.id}>
<strong>{i+1}. {b.type}</strong>
<div className="workspace-form">{b.type!=='divider'&&<label>{b.type==='image'?'Image description':'Content'}<textarea value={b.text} onChange={e=>update(b.id,'text',e.target.value)}/>
</label>}{['image','button'].includes(b.type)&&<label>HTTPS {b.type==='image'?'image':'destination'} URL<input type="url" value={b.url} onChange={e=>update(b.id,'url',e.target.value)}/>
</label>}</div>
<div className="chips">
<button disabled={i===0} onClick={()=>move(i,-1)}>Move up</button>
<button disabled={i===draft.blocks.length-1} onClick={()=>move(i,1)}>Move down</button>
<button onClick={()=>setDraft({...draft,blocks:draft.blocks.filter(x=>x.id!==b.id)})}>Remove</button>
</div>
</div>)}</>}<p className="muted">Exported content needs review of links, variables, unsubscribe handling and recipient consent before campaign delivery. Preview blocks remote tracking images.</p>
</Block>
<Block title="Email preview" kicker="SANDBOXED PREVIEW">
<div className="chips">
<button onClick={()=>setWidth('100%')}>Desktop</button>
<button onClick={()=>setWidth('375px')}>Mobile</button>
</div>
<iframe className="studio-preview" title="Newsletter design preview" sandbox="" srcDoc={preview} style={{width,maxWidth:'100%'}}/>
</Block>
</div>
</>;
}
