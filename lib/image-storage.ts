import {getStore} from '@netlify/blobs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
const imageStore=()=>getStore({name:'voltbazar-trial-images',consistency:'strong',...(process.env.NETLIFY_SITE_ID&&process.env.NETLIFY_BLOBS_TOKEN?{siteID:process.env.NETLIFY_SITE_ID,token:process.env.NETLIFY_BLOBS_TOKEN}:{})});
export const imageBucket={
 async put(id:string,bytes:ArrayBuffer,options:{httpMetadata:{contentType:string}}){if(process.env.VOLTB_STORAGE==='netlify')await imageStore().set(id,bytes,{metadata:options.httpMetadata});else{const dir=path.join(process.cwd(),'.data/images');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,id),Buffer.from(bytes))}},
 async get(id:string){if(process.env.VOLTB_STORAGE==='netlify'){const image=await imageStore().getWithMetadata(id,{type:'arrayBuffer'});return image?{body:image.data,httpMetadata:{contentType:String(image.metadata.contentType)}}:null}try{const bytes=await readFile(path.join(process.cwd(),'.data/images',id));return {body:new Uint8Array(bytes),httpMetadata:{contentType:id.endsWith('.jpg')?'image/jpeg':id.endsWith('.png')?'image/png':'image/webp'}}}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e}}
};
