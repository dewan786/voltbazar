import {Suspense} from 'react';
import {requireChatGPTUser} from '../chatgpt-auth';
import {adminIdentity,listProducts,storeSettings,database} from '@/lib/store';
import {sampleProducts} from '@/lib/catalog';
import Admin from './admin';
export const dynamic='force-dynamic';
export const metadata={title:'Store administration',robots:{index:false,follow:false}};
async function AdminContent(){const user=await requireChatGPTUser('/admin');const admin=await adminIdentity();const s=await storeSettings();const orders=admin?(await database().prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500').all()).results:[];const coupons=admin?(await database().prepare('SELECT * FROM coupons ORDER BY code').all()).results:[];return <Admin initialProducts={admin?await listProducts(true):sampleProducts} initialOrders={orders} initialSettings={s} initialCoupons={coupons} canAdmin={!!admin} userEmail={user.email}/>}
export default function Page(){return <Suspense fallback={<main className="unavailable">Loading store administration…</main>}><AdminContent/></Suspense>}
