import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

export async function GET(req: Request) {
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 7));
  const since = `now() - interval '${days} days'`;
  const [totals, perUser, perDay, outcomes, due, companies] = await Promise.all([
    q(`select count(*)::int calls,
         count(*) filter (where outcome='interested')::int interested,
         count(*) filter (where outcome='meeting_booked')::int meetings,
         count(*) filter (where outcome='email_sent')::int emails,
         count(distinct company_id)::int companies
       from calls where created_at > ${since}`),
    q(`select u.id, u.email, u.role,
         count(k.id)::int calls,
         count(k.id) filter (where k.outcome='interested')::int interested,
         count(k.id) filter (where k.outcome='meeting_booked')::int meetings,
         count(k.id) filter (where k.outcome='email_sent')::int emails,
         count(k.id) filter (where k.outcome='not_interested')::int not_interested,
         count(k.id) filter (where k.outcome in ('no_answer','voicemail'))::int no_answer,
         count(distinct k.company_id)::int companies,
         (select count(*)::int from companies c where c.country=u.country) as list_size,
         max(k.created_at) last_call
       from users u left join calls k on k.user_id=u.id and k.created_at > ${since}
       group by u.id order by calls desc, u.email`),
    q(`select to_char(d::date,'YYYY-MM-DD') as day, coalesce(x.n,0)::int as n, coalesce(x.good,0)::int as good
       from generate_series((now() - interval '${days - 1} days')::date, now()::date, '1 day') d
       left join (select created_at::date dd, count(*) n, count(*) filter (where outcome in ('interested','meeting_booked','email_sent')) good
                  from calls where created_at > ${since} group by 1) x on x.dd = d::date
       order by d`),
    q(`select outcome, count(*)::int n from calls where created_at > ${since} group by outcome order by n desc`),
    q(`select count(*)::int n from (
         select distinct on (company_id) company_id, outcome, followup_at from calls order by company_id, created_at desc) l
       where l.outcome='call_back' and l.followup_at is not null and l.followup_at <= current_date`),
    q(`select count(*)::int n, count(*) filter (where not exists (select 1 from calls k where k.company_id=companies.id))::int untouched from companies`),
  ]);
  return NextResponse.json({ days, totals: totals[0], perUser, perDay, outcomes, followupsDue: due[0].n, companies: companies[0] });
}
