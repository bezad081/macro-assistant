import { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { CHAPTERS, chapterById, type Lang, type ModelState, type ParamSpec } from './data/registry';
import { buildModelView } from './economics/presenters';
import { buildMathView } from './economics/mathView';

type Tab = 'chart' | 'analysis' | 'solution' | 'data';

const clone = <T,>(x:T):T => JSON.parse(JSON.stringify(x));

function initializeStates(storageKey:string) {
  const base: Record<string, ModelState> = {};
  CHAPTERS.forEach(c => base[c.id] = clone(c.defaults));
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    for (const c of CHAPTERS) base[c.id] = { ...base[c.id], ...(saved[c.id] || {}) };
  } catch {}
  return base;
}

function valueText(p:ParamSpec, value:unknown) {
  if (typeof value === 'number') {
    if (p.percent) return `${(value*100).toFixed(Math.abs(value)<.1?1:0)}%`;
    if ((p.step ?? 1) < .001) return value.toFixed(5);
    if ((p.step ?? 1) < .01) return value.toFixed(3);
    if ((p.step ?? 1) < .1) return value.toFixed(2);
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return String(value);
}

function ParameterControl({param,value,lang,onChange}:{param:ParamSpec,value:any,lang:Lang,onChange:(v:any)=>void}) {
  if (param.kind === 'select') {
    return <label className="control-block">
      <div className="control-label"><span>{param.label}</span></div>
      <select value={String(value)} onChange={e=>onChange(e.target.value)}>
        {param.options?.map(o=><option value={o.value} key={o.value}>{lang==='fa'?o.fa:o.en}</option>)}
      </select>
    </label>;
  }
  if (param.kind === 'checkbox') {
    return <label className="switch-row"><span>{lang==='fa'?'نمایش مسیر تعدیل':'Show adjustment path'}</span><input type="checkbox" checked={Boolean(value)} onChange={e=>onChange(e.target.checked)}/><i /></label>;
  }
  return <label className="control-block">
    <div className="control-label"><span>{param.label}</span><b>{valueText(param,value)}</b></div>
    <input className="range" type="range" min={param.min} max={param.max} step={param.step} value={Number(value)} onChange={e=>onChange(Number(e.target.value))}/>
    <div className="range-limits"><span>{valueText(param,param.min)}</span><span>{valueText(param,param.max)}</span></div>
  </label>;
}

function ChartPanel({title,data,layout}:{title:string,data:any[],layout?:any}) {
  return <section className="chart-card panel-card">
    <div className="panel-heading"><h3>{title}</h3><span className="live-dot">LIVE</span></div>
    <Plot
      data={data as any}
      layout={{...(layout||{}),height:390,autosize:true,title:undefined}}
      config={{responsive:true,displaylogo:false,modeBarButtonsToRemove:['lasso2d','select2d'] as any}}
      useResizeHandler
      style={{width:'100%',height:'390px'}}
    />
  </section>;
}

function App() {
  const [lang,setLang]=useState<Lang>(()=>(localStorage.getItem('macro-lang') as Lang)||'fa');
  const [activeId,setActiveId]=useState(()=>localStorage.getItem('macro-active')||'islm');
  const [tab,setTab]=useState<Tab>('chart');
  const [current,setCurrent]=useState<Record<string,ModelState>>(()=>initializeStates('macro-current'));
  const [baseline,setBaseline]=useState<Record<string,ModelState>>(()=>initializeStates('macro-baseline'));
  const [preset,setPreset]=useState<Record<string,string>>({});
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [classroom,setClassroom]=useState(true);

  const chapter=chapterById(activeId);
  const view=useMemo(()=>buildModelView(activeId,current[activeId],baseline[activeId],lang),[activeId,current,baseline,lang]);
  const mathView=useMemo(()=>buildMathView(activeId,current[activeId],lang),[activeId,current,lang]);
  const fa=lang==='fa';

  useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=fa?'rtl':'ltr';localStorage.setItem('macro-lang',lang)},[lang,fa]);
  useEffect(()=>localStorage.setItem('macro-active',activeId),[activeId]);
  useEffect(()=>localStorage.setItem('macro-current',JSON.stringify(current)),[current]);
  useEffect(()=>localStorage.setItem('macro-baseline',JSON.stringify(baseline)),[baseline]);

  const updateParam=(key:string,value:any)=>setCurrent(prev=>({...prev,[activeId]:{...prev[activeId],[key]:value}}));
  const resetCurrent=()=>setCurrent(prev=>({...prev,[activeId]:clone(chapter.defaults)}));
  const captureBaseline=()=>setBaseline(prev=>({...prev,[activeId]:clone(current[activeId])}));
  const resetBaseline=()=>setBaseline(prev=>({...prev,[activeId]:clone(chapter.defaults)}));
  const applyPreset=()=>{
    const pid=preset[activeId]||Object.keys(chapter.presets)[0];
    const p=chapter.presets[pid];
    setCurrent(prev=>({...prev,[activeId]:{...clone(chapter.defaults),...clone(p.values)}}));
  };
  const toggleFullscreen=()=>{if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen?'open':''}`}>
      <div className="brand">
        <div className="brand-mark">M</div>
        <div><strong>MACRO LAB</strong><small>{fa?'دستیار تعاملی اقتصاد کلان':'Interactive Macroeconomics'}</small></div>
      </div>
      <div className="nav-caption">{fa?'مدل‌ها و ابزارها':'MODELS & TOOLS'}</div>
      <nav className="model-nav">
        {CHAPTERS.map((c,i)=><button key={c.id} className={c.id===activeId?'active':''} onClick={()=>{setActiveId(c.id);setTab('chart');setSidebarOpen(false)}}>
          <span className="nav-icon">{c.icon}</span><span className="nav-text"><b>{lang==='fa'?c.fa:c.en}</b><small>{String(i+1).padStart(2,'0')}</small></span>
        </button>)}
      </nav>
      <div className="sidebar-footer"><span className="status-dot"/> {fa?'محاسبات محلی در مرورگر':'Local browser computation'}</div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={()=>setSidebarOpen(v=>!v)}>☰</button>
        <div className="top-title"><span>{chapter.icon}</span><div><h1>{lang==='fa'?chapter.fa:chapter.en}</h1><p>{lang==='fa'?chapter.subtitleFa:chapter.subtitleEn}</p></div></div>
        <div className="top-actions">
          <button className="seg-btn" onClick={()=>setLang(lang==='fa'?'en':'fa')}>{lang==='fa'?'EN':'FA'}</button>
          <button className="icon-btn" title="Fullscreen" onClick={toggleFullscreen}>⛶</button>
        </div>
      </header>

      <div className="workspace">
        <section className="content-column">
          {classroom && <div className="classroom-card"><span>🎓</span><div><b>{fa?'پرسش کلاسی':'Classroom prompt'}</b><p>{fa?chapter.questionFa:chapter.questionEn}</p></div><button onClick={()=>setClassroom(false)}>×</button></div>}

          <div className="metrics-grid">
            {view.metrics.map((m,i)=><div className="metric-card" key={i}><span>{m.label}</span><strong>{m.value}</strong>{m.delta&&<em className={m.delta.trim().startsWith('-')?'negative':'positive'}>{m.delta}</em>}</div>)}
          </div>

          {view.warning&&<div className="warning-card">⚠️ {view.warning}</div>}

          <div className="tabs">
            {([
              ['chart',fa?'نمودار تعاملی':'Interactive charts','📊'],
              ['analysis',fa?'تحلیل دستیار':'Assistant analysis','🧠'],
              ['solution',fa?'حل تحلیلی':'Analytical solution','📐'],
              ['data',fa?'داده‌ها':'Data','📋']
            ] as [Tab,string,string][]).map(([k,label,icon])=><button key={k} onClick={()=>setTab(k)} className={tab===k?'active':''}><span>{icon}</span>{label}</button>)}
          </div>

          {tab==='chart' && <div className={`chart-grid ${view.charts.length===1?'single':''}`}>{view.charts.map((c,i)=><ChartPanel key={i} {...c}/>)}</div>}
          {tab==='analysis' && <section className="text-card panel-card"><div className="analysis-badge">AI</div><h2>{fa?'تفسیر اقتصادی':'Economic interpretation'}</h2><p>{view.analysis}</p><div className="interpret-note">{fa?'نکته: این ابزار برای آموزش و آزمایش مدل‌ها طراحی شده و کالیبراسیون‌ها تخمین تجربی یک کشور خاص نیستند.':'Note: This is a teaching and model-experiment tool; calibrations are not empirical estimates for a specific country.'}</div></section>}
          {tab==='solution' && <section className="text-card panel-card math-solution">
            <h2>{fa?'روابط و حل تحلیلی':'Equations & analytical solution'}</h2>
            <p className="math-intro">{fa?'فرمول‌ها با مقادیر جاری مدل محاسبه می‌شوند؛ با تغییر هر پارامتر، جایگذاری عددی و نتیجه نیز فوراً به‌روزرسانی می‌شود.':'Equations use the current model values; changing any parameter immediately updates the numerical substitution and result.'}</p>
            <div className="math-sections">
              {mathView.map((section,si)=><div className="math-section" key={`${activeId}-${si}-${JSON.stringify(current[activeId])}`}>
                <h3>{section.title}</h3>
                {section.equations.map((eq,ei)=><div className="math-equation" key={ei}><BlockMath math={eq}/></div>)}
                {section.note&&<p className="math-note">{section.note}</p>}
              </div>)}
            </div>
          </section>}
          {tab==='data' && <section className="table-card panel-card"><div className="table-wrap"><table><thead><tr>{view.table.columns.map((c,i)=><th key={i}>{c}</th>)}</tr></thead><tbody>{view.table.rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{typeof v==='number'?(Number.isFinite(v)?v.toLocaleString(undefined,{maximumFractionDigits:5}):'—'):v}</td>)}</tr>)}</tbody></table></div></section>}
        </section>

        <aside className="controls-column">
          <section className="control-card">
            <div className="card-title"><div><span>⚙️</span><b>{fa?'پارامترها':'Parameters'}</b></div><button onClick={resetCurrent}>{fa?'بازنشانی':'Reset'}</button></div>
            <div className="preset-box">
              <label>{fa?'سناریوی آماده':'Preset scenario'}</label>
              <select value={preset[activeId]||Object.keys(chapter.presets)[0]} onChange={e=>setPreset(p=>({...p,[activeId]:e.target.value}))}>
                {Object.entries(chapter.presets).map(([id,p])=><option value={id} key={id}>{lang==='fa'?p.fa:p.en}</option>)}
              </select>
              <button className="primary-btn" onClick={applyPreset}>▶ {fa?'اعمال سناریو':'Apply scenario'}</button>
            </div>
            <div className="controls-list">{chapter.params.map(p=><ParameterControl key={p.key} param={p} value={current[activeId][p.key]} lang={lang} onChange={v=>updateParam(p.key,v)}/>)}</div>
          </section>

          {activeId!=='policy' && <section className="control-card baseline-card">
            <div className="card-title"><div><span>◉</span><b>{fa?'خط مبنا':'Baseline'}</b></div></div>
            <p>{fa?'مقادیر جاری را به‌عنوان E₀ ذخیره کنید تا شوک بعدی با آن مقایسه شود.':'Capture current values as E₀, then compare the next shock against them.'}</p>
            <button className="primary-btn secondary" onClick={captureBaseline}>{fa?'ثبت وضعیت جاری به‌عنوان مبنا':'Capture current as baseline'}</button>
            <button className="ghost-btn" onClick={resetBaseline}>{fa?'بازگرداندن مبنای پیش‌فرض':'Reset default baseline'}</button>
          </section>}
        </aside>
      </div>
    </main>
    {sidebarOpen&&<div className="scrim" onClick={()=>setSidebarOpen(false)}/>} 
  </div>;
}

export default App;
