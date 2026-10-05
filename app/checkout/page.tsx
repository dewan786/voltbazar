import Checkout from './checkout';
import {storeSettings} from '@/lib/store';
import {sslReady} from '@/lib/payments';
export const dynamic='force-dynamic';
export default async function Page(){return <Checkout settings={await storeSettings()} ssl={sslReady()}/>}
