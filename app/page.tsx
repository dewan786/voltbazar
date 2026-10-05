import Storefront from './storefront';
import {listProducts,storeSettings} from '@/lib/store';
export const dynamic='force-dynamic';
export default async function Home(){try{return <Storefront products={await listProducts()} settings={await storeSettings()}/>;}catch(error){console.error("Storefront data failed",error);return <main className="unavailable"><h1>VoltBazar</h1><p>The store is temporarily unavailable. Please try again shortly.</p><a href="/">Try again</a></main>}}
