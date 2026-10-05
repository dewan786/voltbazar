import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import ts from 'typescript';
import assert from 'node:assert/strict';
const dir='.data/blob-tests-'+crypto.randomUUID();await mkdir(dir,{recursive:true});
const blobs=new Map();
const server=createServer(async(req,res)=>{const key=new URL(req.url,'http://localhost').pathname;if(req.headers.authorization!=='Bearer qa-token'){res.writeHead(401).end();return}if(req.method==='GET'){const item=blobs.get(key);if(!item){res.writeHead(404).end();return}res.writeHead(200,{etag:item.etag}).end(item.bytes);return}if(req.method==='PUT'){const chunks=[];for await(const chunk of req)chunks.push(chunk);const bytes=Buffer.concat(chunks),current=blobs.get(key);if(req.headers['if-none-match']==='*'&&current||req.headers['if-match']&&req.headers['if-match']!==current?.etag){res.writeHead(412).end();return}const etag='"'+createHash('sha256').update(bytes).digest('hex')+'"';blobs.set(key,{bytes,etag});res.writeHead(200,{etag}).end();return}res.writeHead(405).end()});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
process.env.VOLTB_STORAGE='netlify';process.env.NETLIFY_BLOBS_CONTEXT=Buffer.from(JSON.stringify({siteID:'qa-site',token:'qa-token',apiURL:url,edgeURL:url,uncachedEdgeURL:url})).toString('base64');
const schema=await readFile('lib/netlify-schema.ts','utf8');let source=await readFile('lib/netlify-db.ts','utf8');source=source.replace("import {schemaSQL} from './netlify-schema';",schema.replace('export const','const'));
const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});const file=dir+'/adapter.cjs';await writeFile(file,result.outputText);
try{const require=createRequire(import.meta.url);const {TrialDatabase}=require('../'+file);const a=new TrialDatabase(),b=new TrialDatabase();await a.prepare('INSERT INTO settings(key,value) VALUES (?,?)').bind('first','1').run();await Promise.all(Array.from({length:6},(_,i)=>{const d=i%2?a:b;return d.prepare('INSERT INTO settings(key,value) VALUES (?,?)').bind('qa-'+i,String(i)).run()}));const reader=new TrialDatabase();const rows=(await reader.prepare("SELECT key FROM settings WHERE key LIKE 'qa-%'").all()).results;assert.equal(rows.length,6);console.log('PASS: Netlify Blobs SDK snapshot persistence, conditional writes and concurrent independent adapters preserve every write.')}finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true})}
