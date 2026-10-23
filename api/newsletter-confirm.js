import { createHmac, timingSafeEqual } from 'node:crypto';

function result(res, valid, en) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  const title = valid ? (en?'Subscription confirmed':'Prijava je potrjena') : (en?'Link is invalid or expired':'Povezava je neveljavna ali je potekla');
  const msg = valid ? (en?'Thank you. You can unsubscribe at any time.':'Hvala. Od novic se lahko kadar koli odjavite.') : (en?'Please subscribe again on doptiva.com.':'Prosimo, prijavite se znova na doptiva.com.');
  return res.status(valid?200:400).end('<!doctype html><html lang="'+(en?'en':'sl')+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Doptiva</title><body style="max-width:600px;margin:12vh auto;padding:24px;font:18px/1.65 system-ui;background:#FAFBF8;color:#192320"><h1>'+title+'</h1><p>'+msg+'</p><a href="https://doptiva.com/">Doptiva →</a></body></html>');
}
export default async function handler(req,res) {
  if(req.method!=='GET')return res.status(405).end();
  const q=req.query||{},en=q.lang==='en';
  const email=String(q.email||'').trim().toLowerCase();
  const expiry=Number(q.expiry), sig=String(q.signature||'');
  const secret=process.env.NEWSLETTER_SIGNING_SECRET;
  const key=process.env.RESEND_API_KEY, segment=process.env.NEWSLETTER_SEGMENT_ID;
  if(!secret||secret.length<32||!key||!segment) return result(res,false,en);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||email.length>160||!Number.isSafeInteger(expiry)||expiry<Date.now()||expiry>Date.now()+49*60*60*1000||!/^[a-f0-9]{64}$/.test(sig)) return result(res,false,en);
  const expected=createHmac('sha256',secret).update(email+':'+expiry).digest('hex');
  if(!timingSafeEqual(Buffer.from(sig,'hex'),Buffer.from(expected,'hex')))return result(res,false,en);
  try{
    const r=await fetch('https://api.resend.com/contacts',{method:'POST',
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({email,unsubscribed:false,segments:[{id:segment}]}),
      signal:AbortSignal.timeout(10000)});
    if(!r.ok){console.error('newsletter confirm',r.status);return result(res,false,en);}
    return result(res,true,en);
  }catch(e){console.error('newsletter confirm failed',String(e.message));return result(res,false,en);}
}
