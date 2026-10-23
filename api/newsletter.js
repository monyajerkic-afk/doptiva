// Doptiva newsletter: double opt-in; no contact stored before email confirmation.
import { createHmac } from 'node:crypto';
export default async function handler(req,res) {
  if(req.method!=='POST') {res.setHeader('Allow','POST');return res.status(405).json({ok:false});}
  const b=req.body||{};
  const email=String(b.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\\.[^\s@]{2,}$/.test(email)||email.length>160||b.consent!=='yes')
    return res.status(422).json({ok:false,error:'invalid'});
  const key=process.env.RESEND_API_KEY;
  const secret=process.env.NEWSLETTER_SIGNING_SECRET;
  const from=process.env.NEWSLETTER_FROM;
  if(!key||!secret||secret.length<32||!from)return res.status(503).json({ok:false,error:'not_configured'});
  const origin=req.headers.origin||'';
  const host=req.headers['x-forwarded-host']||req.headers.host;
  if(origin&&origin!=='https://'+host)return res.status(403).json({ok:false});
  try{
    const expiry=Date.now()+48*60*60*1000;
    const signature=createHmac('sha256',secret).update(email+':'+expiry).digest('hex');
    const link='https://doptiva.com/api/newsletter-confirm?'+new URLSearchParams({email,expiry:String(expiry),signature,lang:b.lang==='en'?'en':'sl'});
    const en=b.lang==='en';
    const r=await fetch('https://api.resend.com/emails',{method:'POST',
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({from,to:[email],subject:en?'Confirm your Doptiva subscription':'Potrdite prijavo na Doptivine novice',
        text:(en?'Confirm your email here: ':'Potrdite e-pošto tukaj: ')+link,
        html:'<p>'+(en?'Confirm your Doptiva newsletter subscription:':'Potrdite prijavo na Doptivine novice:')+'</p><p><a href="'+link+'">'+(en?'Confirm signup':'Potrdi prijavo')+'</a></p><p>'+(en?'Valid for 48 hours.':'Povezava velja 48 ur.')+'</p>'}),
      signal:AbortSignal.timeout(10000)});
    if(!r.ok)return res.status(502).json({ok:false,error:'send_failed'});
    return res.status(200).json({ok:true});
  }catch(e){console.error('newsletter request failed',String(e.message));return res.status(502).json({ok:false});}
}
