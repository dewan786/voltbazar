export const dynamic='force-dynamic';
import type {Metadata} from 'next';
import {storeSettings} from '@/lib/store';
import './globals.css';
export async function generateMetadata():Promise<Metadata>{let name='VoltBazar',demo=true,tagline='Electronics in Bangladesh';try{const s=await storeSettings();name=s.name;demo=s.demo;tagline=s.tagline}catch{}return{metadataBase:new URL((process.env.SITE_ORIGIN||process.env.URL||'http://localhost:3000')),title:{default:name+' | Electronics in Bangladesh',template:'%s | '+name},description:tagline+' Explore laptops, smartphones, audio and electronics. Bangladesh delivery, taka pricing and cash on delivery.',alternates:{canonical:'/'},icons:{icon:'/favicon.svg'},robots:{index:!demo,follow:!demo},openGraph:{siteName:name,locale:'en_US',alternateLocale:'bn_BD',type:'website'}}}
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
