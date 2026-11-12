// Server-owned public documents only. Neither user URLs nor user files enter this pipeline.
export type Book = {id:string;title:string;sources:{title:string;url:string}[]};
export type Document = {book:Book;digest:string;uri:string;checkedAt:string};
type ProviderFile = {name?:string;uri?:string;state?:string;expirationTime?:string};
type Snapshot = {digest?:string;checked_at?:string;provider_file?:ProviderFile;provider_key_hash?:string};
type Options = {fetch:typeof fetch;key:string;base:string;headers:Record<string,string>;now:Date;force?:boolean};
export class DocumentError extends Error {
 constructor(public code:string,message:string,public source?:string){super(message);}
}
export async function digest(value:string|ArrayBuffer):Promise<string> {
 const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function officialURL(value:string):boolean {
 try {const u=new URL(value);return u.protocol==='https:'&&['usssa.com','usssa.net','usssabaseball.org','mlb.com','mlbstatic.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h));}catch{return false;}
}
const sixHours=21600000;
const fileURL=(uri:unknown):uri is string=>typeof uri==='string'&&/^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/files\/[a-zA-Z0-9_-]+$/.test(uri);
const fileName=(name:unknown):name is string=>typeof name==='string'&&/^files\/[a-zA-Z0-9_-]+$/.test(name);
export async function downloadPDF(fetcher:typeof fetch,url:string):Promise<ArrayBuffer> {
 const deadline=AbortSignal.timeout(20000);let target=url;
 for(let redirects=0;redirects<4;redirects++) {
  if(!officialURL(target))throw new DocumentError('source_host','The rulebook redirected outside its official source.',url);
  const response=await fetcher(target,{redirect:'manual',signal:deadline});
  if(response.status>=300&&response.status<400){const next=response.headers.get('location');if(!next)break;target=new URL(next,target).href;continue;}
  if(!response.ok||!response.body)throw new DocumentError('source_http',`The official rulebook server returned HTTP ${response.status}.`,url);
  if(Number(response.headers.get('content-length')??0)>12000000)throw new DocumentError('source_size','The rulebook exceeds the document size limit.',url);
  const chunks:Uint8Array[]=[];let size=0;const reader=response.body.getReader();
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>12000000){await reader.cancel();throw new DocumentError('source_size','The rulebook exceeds the document size limit.',url);}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new DocumentError('source_not_pdf','The official link returned a web page instead of its PDF rulebook.',url);
  return bytes.buffer;
 }
 throw new DocumentError('source_redirect','The official rulebook link could not be resolved.',url);
}
async function activeFile(file:ProviderFile,options:Options):Promise<ProviderFile|null> {
 if(!fileName(file.name)||!fileURL(file.uri)||!(Date.parse(file.expirationTime??'')>options.now.getTime()+300000))return null;
 for(let attempt=0;attempt<5;attempt++) {
  const response=await options.fetch(`https://generativelanguage.googleapis.com/v1beta/${file.name}`,{headers:{'x-goog-api-key':options.key},signal:AbortSignal.timeout(10000)});
  if(response.status===404)return null;
  if(!response.ok)throw new DocumentError(response.status===429?'document_quota':'document_status','Gemini could not verify its uploaded rulebook. Try again shortly.');
  const current=await response.json() as ProviderFile;
  if(current.state==='ACTIVE'&&fileURL(current.uri)&&current.name===file.name&&Date.parse(current.expirationTime??'')>options.now.getTime()+300000)return current;
  if(current.state!=='PROCESSING')return null;
  await new Promise(resolve=>setTimeout(resolve,400));
 }
 throw new DocumentError('document_processing','Gemini is still processing the rulebook. Try the question again shortly.');
}
async function uploadPDF(book:Book,bytes:ArrayBuffer,options:Options):Promise<ProviderFile> {
 const start=await options.fetch('https://generativelanguage.googleapis.com/upload/v1beta/files',{
  method:'POST',headers:{'x-goog-api-key':options.key,'X-Goog-Upload-Protocol':'resumable','X-Goog-Upload-Command':'start','X-Goog-Upload-Header-Content-Length':String(bytes.byteLength),'X-Goog-Upload-Header-Content-Type':'application/pdf','Content-Type':'application/json'},
  body:JSON.stringify({file:{display_name:book.id}}),signal:AbortSignal.timeout(15000),
 });
 if(!start.ok)throw new DocumentError(start.status===429?'document_quota':'document_upload','Gemini could not accept the official rulebook file. Try again later.',book.sources[0].url);
 const upload=start.headers.get('x-goog-upload-url');
 if(!upload||new URL(upload).protocol!=='https:'||new URL(upload).hostname!=='generativelanguage.googleapis.com')throw new DocumentError('document_upload','Gemini returned an invalid document upload address.');
 const result=await options.fetch(upload,{method:'POST',headers:{'Content-Type':'application/pdf','X-Goog-Upload-Offset':'0','X-Goog-Upload-Command':'upload, finalize'},body:bytes,signal:AbortSignal.timeout(20000)});
 if(!result.ok)throw new DocumentError(result.status===429?'document_quota':'document_upload','The official rulebook upload did not complete. Try again later.');
 const file=(await result.json()).file as ProviderFile|undefined;
 const ready=file?await activeFile(file,options):null;
 if(!ready)throw new DocumentError('document_upload','Gemini did not confirm a readable official rulebook file.');
 return ready;
}
export async function loadDocuments(books:Book[],options:Options):Promise<Document[]> {
 const keyHash=await digest(options.key);
 return await Promise.all(books.map(async book=>{
  const url=book.sources[0].url;let snapshot:Snapshot|undefined;
  try {
   const response=await options.fetch(`${options.base}/rest/v1/rules_source_versions?url=eq.${encodeURIComponent(url)}&select=*`,{headers:options.headers,signal:AbortSignal.timeout(5000)});
   if(response.ok)snapshot=(await response.json())[0];
  } catch { /* Missing cache setup must not stop direct document processing. */ }
  const age=options.now.getTime()-Date.parse(snapshot?.checked_at??'');
  const recent=!!snapshot?.digest&&age>=0&&age<sixHours;
  let bytes:ArrayBuffer|undefined;let currentDigest=snapshot?.digest;
  if(options.force||!recent){bytes=await downloadPDF(options.fetch,url);currentDigest=await digest(bytes);}
  let file:ProviderFile|null=null;
  if(snapshot?.digest===currentDigest&&snapshot?.provider_key_hash===keyHash&&snapshot.provider_file)file=await activeFile(snapshot.provider_file,options);
  if(!file){bytes??=await downloadPDF(options.fetch,url);currentDigest=await digest(bytes);file=await uploadPDF(book,bytes,options);}
  const checkedAt=bytes||options.force||!recent?options.now.toISOString():snapshot!.checked_at!;
  try {
   await options.fetch(`${options.base}/rest/v1/rules_source_versions`,{method:'POST',headers:{...options.headers,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({url,digest:currentDigest,checked_at:checkedAt,provider_file:file,provider_key_hash:keyHash}),signal:AbortSignal.timeout(5000)});
  } catch { /* The request can use the verified upload even if cache persistence fails. */ }
  return {book,digest:currentDigest!,uri:file.uri!,checkedAt};
 }));
}
