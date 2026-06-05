import s from "./montra.module.css";

const QUERY_HTML = `<span class="tk-fn">db</span><span class="tk-pn">.</span><span class="tk-fn">movies</span><span class="tk-pn">.</span><span class="tk-fn">find</span><span class="tk-pn">({</span>
  <span class="tk-ky">year</span><span class="tk-pn">:</span> <span class="tk-pn">{</span> <span class="tk-op">$gte</span><span class="tk-pn">:</span> <span class="tk-nm">2010</span> <span class="tk-pn">},</span>
  <span class="tk-st">"imdb.rating"</span><span class="tk-pn">:</span> <span class="tk-pn">{</span> <span class="tk-op">$gt</span><span class="tk-pn">:</span> <span class="tk-nm">8.4</span> <span class="tk-pn">}</span>
<span class="tk-pn">}).</span><span class="tk-fn">sort</span><span class="tk-pn">({</span> <span class="tk-st">"imdb.rating"</span><span class="tk-pn">:</span> <span class="tk-op">-1</span> <span class="tk-pn">})</span>`;

const RESULT_HTML = `<span class="tk-pn">{</span>
  <span class="tk-ky">_id</span><span class="tk-pn">:</span> <span class="tk-dim">ObjectId(</span><span class="tk-st">"573a13bff293…"</span><span class="tk-dim">)</span><span class="tk-pn">,</span>
  <span class="tk-ky">title</span><span class="tk-pn">:</span> <span class="tk-st">"Interstellar"</span><span class="tk-pn">,</span>
  <span class="tk-ky">year</span><span class="tk-pn">:</span> <span class="tk-nm">2014</span><span class="tk-pn">,</span>
  <span class="tk-ky">imdb</span><span class="tk-pn">:</span> <span class="tk-pn">{</span> <span class="tk-ky">rating</span><span class="tk-pn">:</span> <span class="tk-nm">8.6</span> <span class="tk-pn">}</span>
<span class="tk-pn">}</span>`;

const RESULT_HTML_DIM = `<span class="tk-dim">{ </span>title: "Inception", year: 2010, … <span class="tk-dim">}</span>
<span class="tk-dim">{ </span>title: "Parasite", year: 2019, … <span class="tk-dim">}</span>`;

export default function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-neutral-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div className={`${s.gridTexture} pointer-events-none absolute inset-0`} aria-hidden="true" />

      {/* Brand statement */}
      <div className={`${s.rise} relative z-10 max-w-md`}>
        <h2 className="text-[28px] font-semibold leading-[1.18] tracking-tight text-white">
          The fastest way to work with MongoDB.
        </h2>
        <p className="mt-3.5 max-w-sm text-[15px] leading-relaxed text-neutral-400">
          Query, inspect, and edit your collections in a client built for speed and clarity — no
          ceremony, just your data.
        </p>
      </div>

      {/* Faux query editor */}
      <div className={`${s.rise} ${s.d2} relative z-10 my-10`}>
        <div className={s.editor}>
          <div className={s.editorBar}>
            <span className={s.wdot} />
            <span className={s.wdot} />
            <span className={s.wdot} />
            <span className={`ml-1.5 ${s.mono} text-[11px] text-neutral-500`}>
              cluster0 · sample_mflix.movies
            </span>
          </div>

          <div className={`${s.editorBody} ${s.mono} text-[12.5px] leading-[1.7]`}>
            <div className={s.gutter}>
              1<br />2<br />3<br />4
            </div>
            <div className={s.code} dangerouslySetInnerHTML={{ __html: QUERY_HTML }} />
          </div>

          <div className={`${s.editorDiv} flex items-center justify-between ${s.mono} text-[11px]`}>
            <span className="text-neutral-400">3 documents</span>
            <span className="text-neutral-600">12 ms</span>
          </div>

          <div className={`${s.editorResult} ${s.mono} text-[12.5px] leading-[1.7]`}>
            <div
              className={`${s.code} text-neutral-400`}
              dangerouslySetInnerHTML={{ __html: RESULT_HTML }}
            />
            <div
              className={`${s.code} mt-2 text-[#4A4A4A]`}
              dangerouslySetInnerHTML={{ __html: RESULT_HTML_DIM }}
            />
          </div>
        </div>
      </div>

      {/* Connection status */}
      <div className={`${s.rise} ${s.d3} relative z-10 flex items-center gap-2 ${s.mono} text-[11px] text-neutral-500`}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-300" />
        cluster0.mongodb.net · connected · 14 ms
      </div>
    </aside>
  );
}
