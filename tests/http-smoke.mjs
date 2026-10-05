import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3008';
const credentials={email:'qa@example.test',password:'QA-only-test-password-123'};
let server;
async function start(){server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3008'],{env:{...process.env,ADMIN_EMAIL:credentials.email,ADMIN_PASSWORD:credentials.password,ADMIN_SESSION_SECRET:'QA-only-session-secret-at-least-32-characters',VOLTB_STORAGE:'local',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});server.stderr.on('data',d=>process.stderr.write(d));await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Server did not start')),20000);server.stdout.on('data',d=>{if(String(d).includes('Ready')){clearTimeout(timer);resolve()}});server.on('exit',code=>{clearTimeout(timer);reject(new Error('Server exited '+code))})})}
async function stop(){if(!server)return;const running=server;await new Promise(resolve=>{running.on('exit',resolve);running.kill('SIGTERM')});server=null}
const req=(url,options={})=>fetch(origin+url,{...options,redirect:'manual'});
try{await start();
const home=await req('/');assert.equal(home.status,200);assert(!(await home.text()).includes('temporarily unavailable'));
const cart=await req('/api/cart');assert.equal(cart.status,200);const products=(await cart.json()).products;assert(products.length>=6);const cookie=cart.headers.get('set-cookie').split(';')[0];
const post=(url,data,admin='')=>req(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:[cookie,admin].filter(Boolean).join('; ')},body:JSON.stringify(data)});
const added=await post('/api/cart',{action:'add',id:'VB-L01',qty:1});assert.equal(added.status,200,await added.text());
const payload={requestId:crypto.randomUUID(),customer:'Trial QA',phone:'01700000000',email:'qa@example.test',address:'Demo street, Dhaka',city:'Dhaka',method:'cod'};
const checked=await post('/api/checkout',payload),order=await checked.json();assert.equal(checked.status,200,JSON.stringify(order));assert.equal(order.demo,true);
assert.equal((await (await post('/api/checkout',payload)).json()).id,order.id);
assert.equal((await req(order.url)).status,200);assert.equal((await req('/orders/'+order.id)).status,404);
assert.equal((await req('/api/admin/orders',{headers:{'oai-authenticated-user-id':'spoof','oai-authenticated-user-email':credentials.email}})).status,403);
const login=await req('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:origin},body:new URLSearchParams(credentials)});assert.equal(login.status,303);const adminCookie=login.headers.get('set-cookie').split(';')[0];
assert.equal((await req('/api/admin/orders',{headers:{Cookie:adminCookie}})).status,200);assert.equal((await req('/admin',{headers:{Cookie:adminCookie}})).status,200);
const edit=await post('/api/admin/orders',{id:order.id,status:'confirmed',payment_status:'unpaid',tracking:''},adminCookie);assert.equal(edit.status,200,await edit.text());
assert.equal((await (await post('/api/track',{id:order.id,phone:payload.phone})).json()).status,'confirmed');
const booking=await post('/api/services',{action:'book',id:order.id,confirm:true},adminCookie);assert.equal(booking.status,400);
const upload=new FormData();const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');upload.set('file',new Blob([png],{type:'image/png'}),'test.png');const uploaded=await req('/api/admin/upload',{method:'POST',headers:{Cookie:adminCookie,Origin:origin},body:upload});assert.equal(uploaded.status,200);const image=(await uploaded.json()).url;assert.deepEqual(Buffer.from(await (await req(image)).arrayBuffer()),png);
for(const route of ['/products/everyday-pro-laptop','/checkout','/pages/privacy','/robots.txt','/sitemap.xml'])assert.equal((await req(route)).status,200,route);
await stop();await start();assert.equal((await req(order.url)).status,200,'Orders persist across process restart');assert.equal((await req(image)).status,200,'Uploads persist across process restart');
console.log('PASS: storefront, cart, test checkout, receipt privacy, idempotency, admin login/auth, tracking, trial fulfillment guard, images, SEO and persistence across restart.');
}finally{await stop()}
