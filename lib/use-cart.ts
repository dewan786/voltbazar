 'use client';
import {useState,useEffect,useCallback} from 'react';
import type {Product} from './catalog';
export type CartLine={id:string;qty:number};
export type CartData={items:CartLine[];wishlist:string[];products:Product[]};
export function useCart(){const [cart,setCart]=useState<CartData>({items:[],wishlist:[],products:[]});const [busy,setBusy]=useState(false);const [error,setError]=useState('');
useEffect(()=>{const ac=new AbortController();fetch('/api/cart',{signal:ac.signal}).then(async r=>await r.json() as CartData & {error?:string}).then(d=>{if(d.error)setError(d.error);else setCart(d)}).catch(e=>{if(e.name!=='AbortError')setError('Unable to load your cart.')});return()=>ac.abort()},[]);
const change=useCallback(async(action:string,id:string,qty=1)=>{setBusy(true);setError('');try{const r=await fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id,qty})});const d=await r.json() as CartData & {error?:string};if(!r.ok)throw new Error(d.error||'Unable to update cart.');setCart(d);return d}catch(e){setError(e instanceof Error?e.message:'Unable to update cart.');throw e}finally{setBusy(false)}},[]);
return{cart,busy,error,change,setCart};}
