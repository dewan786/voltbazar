export const dynamic='force-dynamic';
import type {MetadataRoute} from 'next';
import {listProducts,storeSettings} from '@/lib/store';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const origin=(process.env.SITE_ORIGIN||process.env.URL||'http://localhost:3000');const s=await storeSettings();if(s.demo)return[];return[{url:origin,changeFrequency:'daily',priority:1},...(await listProducts()).filter(p=>!p.demo).map(p=>({url:origin+'/products/'+p.slug,lastModified:p.updated_at,priority:.8})),...['about','contact','returns','shipping','privacy','terms'].map(p=>({url:origin+'/pages/'+p,priority:.3}))]}
