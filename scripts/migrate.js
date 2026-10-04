const fs=require('fs'),bcrypt=require('bcryptjs'),{Client}=require('pg');
fs.readFileSync('.env.local','utf8').split('\n').forEach(l=>{const i=l.indexOf('=');if(i>0)process.env[l.slice(0,i)]=l.slice(i+1)});
(async()=>{
  const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{ca:require('fs').existsSync('certs/supabase-ca.crt')?require('fs').readFileSync('certs/supabase-ca.crt','utf8'):undefined}});
  await c.connect();
  await c.query(fs.readFileSync('scripts/schema.sql','utf8'));
  const h=bcrypt.hashSync(process.env.ADMIN_PASSWORD,10);
  await c.query(`insert into users(email,password_hash,role) values($1,$2,'admin')
    on conflict(email) do update set password_hash=$2, role='admin'`,[process.env.ADMIN_EMAIL.toLowerCase(),h]);
  const r=await c.query('select email,role from users');console.log(r.rows);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1)});
