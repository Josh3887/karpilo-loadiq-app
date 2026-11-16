export function previewDocument(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,iframe,object,embed,form,input,button,textarea,select,meta,base,link,svg,math,audio,video').forEach(el=>el.remove());
 doc.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes])if(/^on/i.test(a.name)||['href','srcdoc','action','formaction','target','srcset','ping'].includes(a.name))el.removeAttribute(a.name)});
 const csp=doc.createElement('meta');csp.httpEquiv='Content-Security-Policy';csp.content="default-src 'none'; style-src 'unsafe-inline'; img-src https://d1qknrii3xlp5o.cloudfront.net data:; base-uri 'none'; form-action 'none'";doc.head.prepend(csp);
 return '<!doctype html>'+doc.documentElement.outerHTML;
}
