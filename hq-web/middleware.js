import { NextResponse } from 'next/server';
export async function middleware(request) {
if(request.nextUrl.pathname==='/preview')return NextResponse.next();
const password=process.env.HQ_ADMIN_PASSWORD,user=process.env.HQ_ADMIN_USER;
if(!password||!user||password.length<16)return new NextResponse('Karpilo LoadIQ HQ: founder access is not configured.',{status:503,headers:{'Cache-Control':'no-store'}});
const authorization=request.headers.get('authorization')||'';let suppliedUser='',suppliedPassword='';
if(authorization.startsWith('Basic ')){try{const credentials=atob(authorization.slice(6)),index=credentials.indexOf(':');if(index>=0){suppliedUser=credentials.slice(0,index);suppliedPassword=credentials.slice(index+1);}}catch{}}
const encoder=new TextEncoder();const [eu,au,ep,ap]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(user)),crypto.subtle.digest('SHA-256',encoder.encode(suppliedUser)),crypto.subtle.digest('SHA-256',encoder.encode(password)),crypto.subtle.digest('SHA-256',encoder.encode(suppliedPassword))]);
const eq=(a,b)=>{const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;};
if(!eq(eu,au)||!eq(ep,ap))return new NextResponse('Founder authentication required.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Karpilo LoadIQ HQ"','Cache-Control':'no-store'}});
const response=NextResponse.next();response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Frame-Options','DENY');return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};