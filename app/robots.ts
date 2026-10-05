export const dynamic='force-dynamic';
import type {MetadataRoute} from 'next';
import {storeSettings} from '@/lib/store';
export default async function robots():Promise<MetadataRoute.Robots>{const s=await storeSettings();return{rules:{userAgent:'*',allow:s.demo?undefined:'/',disallow:s.demo?'/':['/admin','/api','/checkout','/orders','/track','/payment-result']},sitemap:s.demo?undefined:(process.env.SITE_ORIGIN||process.env.URL||'http://localhost:3000')+'/sitemap.xml'}}
