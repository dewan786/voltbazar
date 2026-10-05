 'use client';
import {useState} from 'react';
import {useCart} from '@/lib/use-cart';
export default function Buy({id,available}:{id:string;available:boolean}){const{change,busy}=useCart();const[message,setMessage]=useState('');return <div><button disabled={busy||!available} className="dark-button" onClick={async()=>{try{await change('add',id);setMessage('Added to bag. / ব্যাগে যোগ করা হয়েছে।')}catch(e){setMessage(e instanceof Error?e.message:'Unable to add product')}}}>Add to bag / ব্যাগে যোগ করুন</button><a href="/checkout" className="dark-button" style={{marginLeft:10}}>Checkout</a><p role="status">{message}</p></div>}
