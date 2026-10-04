'use client';
import { createContext, useContext, useState } from 'react';
import { FIXED, Lang } from '@/lib/fixed';
import { S_BR, S_TR } from '@/lib/swatermark';

/* All geometry below is in the original 1080x608 design pixels, scaled by --u (= slide width / 1080). */
const U = (n: number) => `calc(${n} * var(--u))`;
const Ctx = createContext<{ edit: boolean; deckId?: number }>({ edit: false });

function E({ path, children, as: Tag = 'span' }: { path: string; children: string; as?: any }) {
  const { edit, deckId } = useContext(Ctx);
  if (!edit) return <Tag>{children}</Tag>;
  return (
    <Tag
      className="ed"
      contentEditable
      suppressContentEditableWarning
      onBlur={async (e: any) => {
        const v = e.currentTarget.innerText.trim();
        if (v === children) return;
        await fetch(`/api/decks/${deckId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: 'slides.' + path, value: v }) });
      }}
    >
      {children}
    </Tag>
  );
}

const hl = (t: string) => t.split(/(⟦.*?⟧)/).map((p, i) => (p.startsWith('⟦') ? <mark key={i}>{p.slice(1, -1)}</mark> : <span key={i}>{p}</span>));
const WHERE: Record<Lang, string> = { lt: 'Kur tai pritaikoma', en: 'Where it fits', de: 'Wo es passt' };
const TOTAL = 23;

function Watermark({ shape, style }: { shape: { d: string; rect: number[] }; style?: any }) {
  const [x0, y0, x1, y1] = shape.rect;
  return (
    <svg className="wm" viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} style={{ left: U(x0), top: U(y0), width: U(x1 - x0), height: U(y1 - y0), ...style }}>
      <path d={shape.d} />
    </svg>
  );
}

function Slide({ n, dark, nopg, children }: { n: number; dark?: boolean; nopg?: boolean; children: any }) {
  return (
    <section className={'slide ' + (dark ? 'dark' : 'light')}>
      {children}
      {!nopg && <div className="pg">{String(n).padStart(2, '0')} / {TOTAL}</div>}
    </section>
  );
}

const Lab = ({ y = 53, children, cls = '' }: { y?: number; children: any; cls?: string }) => <div className={'lab ' + cls} style={{ top: U(y) }}>{children}</div>;
const H = ({ y, size = 33, children, w = 600, cls = '' }: any) => <h2 className={'h ' + cls} style={{ top: U(y - 2.2), fontSize: U(size), lineHeight: size >= 54 ? 1.0 : 1.134, maxWidth: U(w) }}>{children}</h2>;

function Win({ img, bar, children }: { img?: string; bar?: boolean; children?: any }) {
  return (
    <div className="win" style={{ left: U(463), top: U(80), width: U(554), height: U(391) }}>
      {bar && (
        <div className="wbar"><i /><i /><i /></div>
      )}
      {img && <img className="shot" src={`/portfolio/${img}.jpg`} alt="" style={{ objectPosition: img === 'hakom' ? 'center top' : 'left top', top: bar ? U(29) : 0, height: bar ? U(362) : '100%' }} />}
      {children}
    </div>
  );
}

function Stats({ items }: { items: [string, string][] }) {
  return (
    <>
      <div className="rule" style={{ top: U(495) }} />
      <div className="stats" style={{ top: U(516) }}>
        {items.map(([v, l], i) => (
          <div key={i}><b>{v}</b><small>{l}</small></div>
        ))}
      </div>
    </>
  );
}

function CaseCol({ lab, name, sub, nameText, blocks }: { lab: string; name: any; sub: any; nameText: string; blocks: { label: string; text: any }[] }) {
  const long = nameText.length > 17;
  return (
    <>
      <Lab y={53.4}>{lab}</Lab>
      <div className="case-head" style={{ top: U(81), width: U(352) }}>
        <div className="case-name" style={{ fontSize: U(long ? 30 : 40.5), lineHeight: long ? U(32) : U(40.5) }}>{name}</div>
        <div className="case-sub" style={{ fontSize: U(15.8), marginTop: U(long ? 9 : 8.5) }}>{sub}</div>
        <div className="case-col" style={{ marginTop: U(27) }}>
          {blocks.map((b, i) => (
            <div key={i} className="blk"><small className="lime">{b.label}</small><p>{b.text}</p></div>
          ))}
        </div>
      </div>
    </>
  );
}

const TONE = ['ok', 'ok', 'bad', 'wait'];

export default function Deck({ slides, lang, edit = false, deckId }: { slides: any; lang: Lang; edit?: boolean; deckId?: number }) {
  const f = FIXED[lang];
  const S = slides;
  let n = 0;
  const next = () => ++n;
  const name: string = S.companyName;
  const [logoFail, setLogoFail] = useState(false);

  return (
    <Ctx.Provider value={{ edit, deckId }}>
      <div className="deck">
        {/* 1 cover */}
        <Slide n={next()} dark nopg>
          <div className="glow" style={{ left: U(540), top: U(127), width: U(540), height: U(481) }} />
          <div className="coverlab" style={{ left: U(63), top: U(53) }}>{f.cover.kicker}</div>
          <div className="coverlab" style={{ right: U(65), top: U(53) }}>{f.cover.right}</div>
          <img src="/swiftrix-s.png" alt="" style={{ position: 'absolute', left: U(527), top: U(175), width: U(26), height: U(25) }} />
          <div className="wordmark" style={{ top: U(218), fontSize: U(42) }}>SWIFTRIX</div>
          <div className="times" style={{ top: U(280), fontSize: U(11.2) }}>×</div>
          <div className="clogo" style={{ top: U(315), height: U(45) }}>
            {S.logo && !logoFail ? <span className={S.logoTone === 'light' ? 'plain' : 'plate'}><img src={S.logo} alt={name} onError={() => setLogoFail(true)} /></span> : <span className="ctext">{name}</span>}
          </div>
          <p className="tagline" style={{ top: U(396), fontSize: U(15), lineHeight: U(23), width: U(340) }}><E path="cover.tagline">{S.cover?.tagline || ''}</E></p>
          <div className="coverfoot" style={{ left: U(63), top: U(551) }}><i />{f.cover.foot}</div>
          <div className="coverlab lc" style={{ right: U(65), top: U(551), fontSize: U(8.2) }}>swiftrix.eu</div>
        </Slide>

        {/* 2 what we do */}
        <Slide n={next()}>
          <Lab y={207.4}>{f.what.label}</Lab>
          <h2 className="h" style={{ top: U(228.3), fontSize: U(33), lineHeight: U(37.4), maxWidth: U(596) }}>{f.what.before}<mark className="big">{f.what.hl}</mark>{f.what.after}</h2>
          <div className="chips" style={{ position: 'absolute', left: U(63), top: U(369.4) }}>{f.what.chips.map((c) => <span key={c}>{c}</span>)}</div>
        </Slide>

        {/* 3 why */}
        <Slide n={next()}>
          <Lab>{f.why.label}</Lab>
          <H y={78} w={440}>{f.why.title}</H>
          {[204, 304, 405, 506].map((y) => <div key={y} className="rule dk" style={{ top: U(y) }} />)}
          {f.why.items.map((t, i) => (
            <div key={i}>
              <div className="num" style={{ top: U(237 + i * 100.5), fontSize: U(10.5) }}>0{i + 1}</div>
              <p className="whyrow" style={{ top: U(204 + i * 100.5), height: U(100), left: U(148), width: U(680), fontSize: U(20.2), lineHeight: U(27) }}><span>{hl(t)}</span></p>
            </div>
          ))}
        </Slide>

        {/* 4 what we build */}
        <Slide n={next()}>
          <Lab>{f.build.label}</Lab>
          <H y={76}>{f.build.title}</H>
          <div className="box" style={{ left: U(63), top: U(189), width: U(954), height: U(333) }} />
          <div className="line v dk" style={{ left: U(539.5), top: U(189), height: U(333) }} />
          <div className="line h dk" style={{ left: U(63), top: U(355), width: U(954) }} />
          {f.build.items.map((it, i) => (
            <div key={i} className="cell" style={{ left: U(95 + (i % 2) * 477), top: U(220 + Math.floor(i / 2) * 166), width: U(350) }}>
              <small className="num2">/ 0{i + 1}</small>
              <h4 style={{ fontSize: U(16.5), marginTop: U(14) }}>{it.t}</h4>
              <p style={{ fontSize: U(12), lineHeight: U(19.2), marginTop: U(9) }}>{it.d}</p>
            </div>
          ))}
        </Slide>

        {/* 5 selected work intro */}
        <Slide n={next()} dark>
          <Watermark shape={S_BR} />
          <Lab y={222.4}>{f.worksIntro.label}</Lab>
          <h2 className="h" style={{ top: U(249.7), fontSize: U(55.5), lineHeight: U(55.5), maxWidth: U(700) }}>{f.worksIntro.title}</h2>
          <p className="lead abs" style={{ top: U(325.6), fontSize: U(14.2), lineHeight: U(22.6), width: U(470) }}>{f.worksIntro.text}</p>
        </Slide>

        {/* 6-11 case studies */}
        {f.works.map((w, i) => (
          <Slide key={w.name} n={next()} dark>
            <CaseCol lab={w.tag} name={w.name} nameText={w.name} sub={w.sub} blocks={[{ label: f.ui.problem.toUpperCase(), text: w.problem }, { label: f.ui.solution.toUpperCase(), text: w.solution }]} />
            <Win img={w.img} bar={w.img === 'upshift'} />
            <Stats items={w.stats} />
          </Slide>
        ))}

        {/* 12 pattern */}
        <Slide n={next()}>
          <Lab y={54}>{f.pattern.label}</Lab>
          <H y={76} w={420}>{f.pattern.title}</H>
          {f.pattern.cols.map((c, i) => (
            <div key={i} className="pcol" style={{ left: U(63 + i * 329), top: U(277), width: U(296) }}>
              <h4 style={{ fontSize: U(18), lineHeight: U(19.5), minHeight: U(39) }}>{c.t}</h4>
              <p style={{ fontSize: U(12), lineHeight: U(19.3), marginTop: U(12) }}>{c.d}</p>
              <small className="ex">{c.ex}</small>
            </div>
          ))}
        </Slide>

        {/* 13 how we work */}
        <Slide n={next()}>
          <Lab y={54}>{f.how.label}</Lab>
          <H y={76} w={500}>{f.how.title}</H>
          {f.how.steps.map((s, i) => (
            <div key={i} className={'dcard' + (i === 3 ? ' inv' : '')} style={{ left: U([63, 306, 549, 791][i]), top: U(259), width: U(226), height: U(193) }}>
              <small className="num2">0{i + 1}</small>
              <h4 style={{ fontSize: U(15.8), lineHeight: U(17) }}>{s.t}</h4>
              <p style={{ fontSize: U(11.2), lineHeight: U(18) }}>{s.d}</p>
            </div>
          ))}
        </Slide>

        {/* 14 why swiftrix */}
        <Slide n={next()}>
          <Lab>{f.diff.label}</Lab>
          <H y={78}>{f.diff.title}</H>
          {[238, 304, 369, 435].map((y) => <div key={y} className="rule dk" style={{ top: U(y) }} />)}
          {f.diff.rows.map((r, i) => (
            <div key={i}>
              <div className="drow-t" style={{ top: U(262 + i * 65.7), fontSize: U(16.5) }}>{r.t}</div>
              <div className="drow-d" style={{ top: U(263 + i * 65.7), fontSize: U(12.8), width: U(640), left: U(375) }}>{r.d}</div>
            </div>
          ))}
        </Slide>

        {/* 15 in short */}
        <Slide n={next()} dark>
          <Lab y={54}>{f.short.label}</Lab>
          {f.short.items.map((c, i) => (
            <div key={i} className="scol" style={{ left: U(63 + i * 330), top: U(244), width: U(250) }}>
              <div className="big" style={{ fontSize: U(54) }}>{c.v}</div>
              <h4 style={{ fontSize: U(15) }}>{c.t}</h4>
              <p style={{ fontSize: U(11.6), lineHeight: U(18) }}>{c.d}</p>
            </div>
          ))}
        </Slide>

        {/* 16 three ways */}
        <Slide n={next()}>
          <Lab y={54}>{f.start.label}</Lab>
          <H y={76}>{f.start.title}</H>
          {f.start.items.map((s, i) => (
            <div key={i} className={'dcard c3' + (i === 2 ? ' inv' : '')} style={{ left: U([63, 388, 712][i]), top: U(242), width: U(305), height: U(190) }}>
              <small className="num2">0{i + 1}</small>
              <h4 style={{ fontSize: U(18), lineHeight: U(19.3) }}>{s.t}</h4>
              <p style={{ fontSize: U(12), lineHeight: U(19.3) }}>{s.d}</p>
            </div>
          ))}
        </Slide>

        {/* 17 ideas intro (generated) */}
        <Slide n={next()} dark>
          <Watermark shape={S_BR} />
          <Lab y={205.4}>10 — {f.ideasLabel} · {name.toUpperCase()}</Lab>
          <h2 className="h" style={{ top: U(233.5), fontSize: U(55.5), lineHeight: U(55), maxWidth: U(330) }}>{WHERE[lang]}</h2>
          <p className="lead abs" style={{ top: U(364.5), fontSize: U(14.2), lineHeight: U(23), width: U(480) }}><E path="ideasIntro.text">{S.ideasIntro?.text || ''}</E></p>
        </Slide>

        {/* 18-21 idea slides */}
        {S.ideas.map((it: any, i: number) => (
          <Slide key={i} n={next()} dark>
            <CaseCol
              lab={`${f.ideasLabel.replace(/S$/, '')} 0${i + 1} · ${(f.kinds[it.kind] || f.kinds.tool)}`}
              name={<E path={`ideas.${i}.name`}>{it.name || ''}</E>} nameText={it.name || ''}
              sub={<E path={`ideas.${i}.subtitle`}>{it.subtitle || ''}</E>}
              blocks={[
                { label: f.ui.today, text: <E path={`ideas.${i}.problem`}>{it.problem || ''}</E> },
                { label: f.ui.wouldBuild, text: <E path={`ideas.${i}.solution`}>{it.solution || ''}</E> },
              ]}
            />
            <Win bar>
              <div className="mock">
                <div className="mh"><b>{it.mock?.title}</b><small>{it.mock?.subtitle}</small></div>
                <div className="kpis">{(it.mock?.kpis || []).map((k: any, j: number) => <div key={j}><small>{k.l}</small><b>{k.v}</b></div>)}</div>
                <div className="tbl">
                  <div className="tr th">{(it.mock?.cols || []).map((c: string, j: number) => <span key={j}>{c}</span>)}</div>
                  {(it.mock?.rows || []).map((r: string[], j: number) => (
                    <div className="tr" key={j}>{r.map((c, k) => <span key={k} className={k === r.length - 1 ? 'st ' + TONE[j] : ''}>{c}</span>)}</div>
                  ))}
                </div>
              </div>
            </Win>
            <Stats items={(it.stats || []).map((s: any) => [s.v, s.l] as [string, string])} />
          </Slide>
        ))}

        {/* 22 questions */}
        <Slide n={next()}>
          <Lab y={54}>11 — {f.qLabel}</Lab>
          <H y={76} w={560}>{lang === 'lt' ? 'Ką automatizuojame pirmiausia?' : lang === 'de' ? 'Was automatisieren wir zuerst?' : 'What do we automate first?'}</H>
          <div className="box" style={{ left: U(63), top: U(173), width: U(954), height: U(299) }} />
          <div className="line v dk" style={{ left: U(539.5), top: U(173), height: U(299) }} />
          <div className="line h dk" style={{ left: U(63), top: U(331), width: U(954) }} />
          {(S.questions || []).map((x: any, i: number) => (
            <div key={i} className="qcell" style={{ left: U(94 + (i % 2) * 476), top: U(199 + Math.floor(i / 2) * 158), width: U(400) }}>
              <small className="num2">Q 0{i + 1}</small>
              <h4 style={{ fontSize: U(15.8), lineHeight: U(20) }}><E path={`questions.${i}.q`}>{x.q || ''}</E></h4>
              <p style={{ fontSize: U(11.2), lineHeight: U(18) }}><E path={`questions.${i}.d`}>{x.d || ''}</E></p>
            </div>
          ))}
          <div className="qfoot" style={{ top: U(548), fontSize: U(11.2) }}>{f.qFoot}</div>
        </Slide>

        {/* 23 closing */}
        <Slide n={next()} dark nopg>
          <Watermark shape={S_TR} />
          <Lab y={54} cls="grey">{f.closeLabel}</Lab>
          <h2 className="h" style={{ top: U(108), fontSize: U(42), lineHeight: U(47), maxWidth: U(700) }}><E path="closing.title">{S.closing?.title || ''}</E></h2>
          <p className="lead" style={{ position: 'absolute', left: U(63), top: U(228), fontSize: U(14.2), lineHeight: U(23), width: U(620) }}><E path="closing.text">{S.closing?.text || ''}</E></p>
          <img src="/swiftrix-s.png" alt="" style={{ position: 'absolute', left: U(63), top: U(540), width: U(19), height: U(19) }} />
          <div className="wordmark sm" style={{ left: U(98), top: U(540), fontSize: U(18) }}>SWIFTRIX</div>
          <div className="coverlab mail" style={{ right: U(64), top: U(529), fontSize: U(10.5) }}>info@swiftrix.eu</div>
          <div className="coverlab lc" style={{ right: U(64), top: U(551), fontSize: U(9) }}>swiftrix.eu</div>
        </Slide>
      </div>
    </Ctx.Provider>
  );
}
