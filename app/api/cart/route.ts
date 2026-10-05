import {cartSession} from '@/lib/cart-session';
import {z} from 'zod';
import {database,initialize,json,sameOrigin,listProducts,limit} from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{const c=await cartSession(req);return json({items:c.items,wishlist:c.wishlist,products:await listProducts()})}catch(e){console.error(e);return json({error:'Unable to load your shopping bag.'},503)}}
const action=z.object({action:z.enum(['add','quantity','remove','wishlist']),id:z.string().min(1).max(80),qty:z.number().int().min(0).max(20).default(1)});
export async function POST(req:Request){try{if(!sameOrigin(req))return json({error:'Invalid request origin'},403);const data=action.parse(await req.json());const c=await cartSession(req);await limit('cart:'+c.id,60);const products=await listProducts();const p=products.find(p=>p.id===data.id);if(!p)return json({error:'Product unavailable'},404);let items=c.items;let wish=c.wishlist;
if(data.action==='wishlist')wish=wish.includes(p.id)?wish.filter(id=>id!==p.id):[...wish,p.id].slice(-100);
else if(data.action==='remove'||data.action==='quantity'&&data.qty===0)items=items.filter(l=>l.id!==p.id);
else{const old=items.find(l=>l.id===p.id)?.qty||0;const qty=data.action==='add'?old+data.qty:data.qty;if(qty>p.stock||qty>20||qty<1)return json({error:'Requested quantity is unavailable. Maximum 20 per product.'},409);items=[...items.filter(l=>l.id!==p.id),{id:p.id,qty}];if(items.length>30)return json({error:'Your cart can hold up to 30 different products.'},400)}
await database().prepare('UPDATE carts SET items=?,wishlist=?,updated_at=? WHERE id=?').bind(JSON.stringify(items),JSON.stringify(wish),new Date().toISOString(),c.id).run();return json({items,wishlist:wish,products})}catch(e){return json({error:e instanceof z.ZodError?'Please check the product and quantity.':e instanceof Error?e.message:'Unable to update your shopping bag.'},400)}}
