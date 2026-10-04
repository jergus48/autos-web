import fs from 'fs';
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0)process.env[l.slice(0,i)]=l.slice(i+1)});
(async()=>{
  const { q, pool } = await import('../lib/db');
  const { logoTone } = await import('../lib/research');
  const rows = await q('select id, slides from decks');
  for (const r of rows) {
    const s = r.slides || {};
    if (s.logoTone) continue;
    s.logoTone = s.logo ? await logoTone(s.logo) : 'dark';
    await q('update decks set slides=$2 where id=$1', [r.id, s]);
    console.log('deck', r.id, s.logo, '->', s.logoTone);
  }
  await pool.end();
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
