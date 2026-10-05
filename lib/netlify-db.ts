import initSqlJs, {type Database as SQLite} from 'sql.js';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {getStore} from '@netlify/blobs';
import {schemaSQL} from './netlify-schema';
let sql:ReturnType<typeof initSqlJs>|undefined;
const getSQL=()=>sql??=readFile(path.join(process.cwd(),'node_modules/sql.js/dist/sql-wasm.wasm')).then(bytes=>initSqlJs({wasmBinary:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer}));
type Row=Record<string,any>;
type Result<T=Row>={results:T[];success:true;meta:{changes:number}};
class Statement{
 constructor(readonly owner:TrialDatabase,readonly query:string,readonly args:unknown[]=[]){ }
 bind(...args:unknown[]){return new Statement(this.owner,this.query,args)}
 async all<T=Row>():Promise<Result<T>>{return (await this.owner.execute([this],false))[0] as Result<T>}
 async first<T=Row>():Promise<T|null>{return (await this.all<T>()).results[0]??null}
 async run(){return (await this.owner.execute([this],true))[0]}
}
export class TrialDatabase{
 private queue:Promise<unknown>=Promise.resolve();
 prepare(query:string){return new Statement(this,query)}
 batch(statements:Statement[]){return this.execute(statements,true)}
 async execute(statements:Statement[],write:boolean):Promise<Result[]>{
  const task=()=>this.perform(statements,write);const pending=this.queue.then(task,task);this.queue=pending.catch(()=>{});return pending;
 }
 private async perform(statements:Statement[],write:boolean):Promise<Result[]>{
  const mode=process.env.VOLTB_STORAGE||(process.env.NODE_ENV==='production'?'':'local');if(!['local','netlify'].includes(mode))throw new Error('Set VOLTB_STORAGE=netlify in Netlify environment variables, or local in .env.local for local testing.');const remote=mode==='netlify';
  const store=remote?getStore({name:'voltbazar-trial-db',consistency:'strong',...(process.env.NETLIFY_SITE_ID&&process.env.NETLIFY_BLOBS_TOKEN?{siteID:process.env.NETLIFY_SITE_ID,token:process.env.NETLIFY_BLOBS_TOKEN}:{})}):null;
  const filename=path.join(process.cwd(),'.data','voltbazar.sqlite');
  for(let attempt=0;attempt<8;attempt++){
   let bytes:ArrayBuffer|Uint8Array|undefined,etag:string|undefined;
   if(store){const snapshot=await store.getWithMetadata('database',{type:'arrayBuffer'});if(snapshot){bytes=snapshot.data;etag=snapshot.etag;if(!etag)throw new Error('Blob storage did not return a version tag. Verify the Netlify Blobs environment.');}}
   else{try{bytes=await readFile(filename)}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}}
   const module=await getSQL();const db=new module.Database(bytes?new Uint8Array(bytes):undefined);
   try{
    if(!bytes)db.run(schemaSQL);
    db.run('BEGIN');const results=statements.map(s=>executeStatement(db,s));db.run('COMMIT');
    if(write||!bytes){const output=db.export();if(store){const saved=await store.set('database',output.buffer.slice(output.byteOffset,output.byteOffset+output.byteLength) as ArrayBuffer,etag?{onlyIfMatch:etag}:{onlyIfNew:true});if(!saved.modified)continue}else{await mkdir(path.dirname(filename),{recursive:true});const temporary=filename+'.'+crypto.randomUUID()+'.tmp';await writeFile(temporary,output);await rename(temporary,filename)}}
    return results;
   }finally{db.close()}
  }
  throw new Error('The trial store is busy. Please retry.');
 }
}
function executeStatement(db:SQLite,s:Statement):Result{
 const prepared=db.prepare(s.query);try{prepared.bind(s.args as (string|number|null|Uint8Array)[]);const results:Row[]=[];while(prepared.step())results.push(prepared.getAsObject());return{results,success:true,meta:{changes:db.getRowsModified()}}}finally{prepared.free()}
}
const globalDB=globalThis as typeof globalThis&{voltbTrialDB?:TrialDatabase};
export const trialDB=globalDB.voltbTrialDB??=new TrialDatabase();
