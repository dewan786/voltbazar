import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {createHmac,timingSafeEqual} from 'node:crypto';
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
export function adminConfigured(){return !!(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD&&process.env.ADMIN_PASSWORD.length>=12&&process.env.ADMIN_SESSION_SECRET&&process.env.ADMIN_SESSION_SECRET.length>=32)}
const mac=(text:string)=>createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update(text).digest('base64url');
export function issueSession(){const payload=Buffer.from(JSON.stringify({email:process.env.ADMIN_EMAIL,expires:Date.now()+8*3600000})).toString('base64url');return payload+'.'+mac(payload)}
export function equalSecret(a:string,b:string){const one=createHmac('sha256','voltb-password-check').update(a).digest(),two=createHmac('sha256','voltb-password-check').update(b).digest();return timingSafeEqual(one,two)}
export async function getChatGPTUser():Promise<ChatGPTUser|null>{if(!adminConfigured())return null;const token=(await cookies()).get('vb_admin')?.value;if(!token)return null;const [payload,signature,...extra]=token.split('.');if(extra.length||!payload||!signature||!equalSecret(signature,mac(payload)))return null;try{const d=JSON.parse(Buffer.from(payload,'base64url').toString());if(d.email!==process.env.ADMIN_EMAIL||!Number.isFinite(d.expires)||d.expires<Date.now())return null;return{userId:'netlify-admin',email:d.email,displayName:'Store administrator',fullName:null}}catch{return null}}
export async function requireChatGPTUser(_returnTo:string):Promise<ChatGPTUser>{if(!adminConfigured())return{userId:'read-only',email:'Admin login not configured',displayName:'Read-only preview',fullName:null};const user=await getChatGPTUser();if(!user)redirect('/admin/login');return user}
export const chatGPTSignInPath=()=>'/admin/login';
export const chatGPTSignOutPath=()=>'/admin/logout';
