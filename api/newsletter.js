// Doptiva newsletter: GDPR opt-in, Resend Contacts.
export default async function handler(req,res) {
  if(req.method!=='POST') {res.setHeader('Allow','POST');return res.status(405).json({ok:false});}
  const b=req.body||{};
  const email=String(b.email||'').trim().toLowerCase();
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email)||email.length>160||b.consent!=='yes')
    return res.status(422).json({ok:false,error:'invalid'});
  const key=process.env.RESEND_API_KEY;
  const segment=process.env.NEWSLETTER_SEGMENT_ID;
  if(!key||!segment)return res.status(503).json({ok:false,error:'not_configured'});
  const origin=req.headers.origin||'';
  const host=req.headers['x-forwarded-host']||req.headers.host;
  if(origin&&origin!=='https://'+host)return res.status(403).json({ok:false});
  try{
    const r=await fetch('https://api.resend.com/contacts',{method:'POST',
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({email,unsubscribed:false,segments:[{id:segment}]}),
      signal:AbortSignal.timeout(10000)});
    if(!r.ok)return res.status(502).json({ok:false,error:'send_failed'});
    return res.status(200).json({ok:true});
  }catch(e){console.error('newsletter request failed',String(e.message));return res.status(502).json({ok:false});}
}
