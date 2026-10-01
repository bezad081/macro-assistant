import {
  ADASModel,
  ExpectationsPhillipsModel,
  FiscalDebtModel,
  GoodsMarketModel,
  ISLMEngine,
  LaborMarketModel,
  MoneyMarketModel,
  MonetaryTransmissionModel,
  MundellFlemingModel,
  runPolicyScenario,
  SolowModel,
  TaylorRuleModel,
} from './models';
import type { Lang, ModelState } from '../data/registry';

export type MathSection = {
  title: string;
  equations: string[];
  note?: string;
};

const n = (x: unknown) => Number(x);
const s = (x: unknown) => String(x);
const f = (x: number, d = 3) => Number.isFinite(x) ? x.toFixed(d) : '\\text{undefined}';
const p = (x: number, d = 2) => `${(100 * x).toFixed(d)}\\%`;

export function buildMathView(id: string, v: ModelState, lang: Lang): MathSection[] {
  const fa = lang === 'fa';

  if (id === 'goods') {
    const m = new GoodsMarketModel({ c0:n(v.c0), mpc:n(v.mpc), t:n(v.tax), G:n(v.G) });
    const r=n(v.r), I=m.investment(r), A=m.autonomousSpending(r), Y=m.solveEquilibriumOutput(r);
    return [
      { title: fa?'۱. ضریب فزاینده':'1. Keynesian multiplier', equations:[
        `\\alpha=\\frac{1}{1-c_1(1-t)}=\\frac{1}{1-${f(m.mpc,2)}(1-${f(m.t,2)})}=${f(m.multiplier,3)}`
      ]},
      { title: fa?'۲. سرمایه‌گذاری و مخارج خودمختار':'2. Investment and autonomous spending', equations:[
        `I=I_0-br=${f(m.i0,1)}-(${f(m.b,0)}\\times ${f(r,3)})=${f(I,2)}`,
        `A=c_0+I+G=${f(m.c0,1)}+${f(I,2)}+${f(m.G,1)}=${f(A,2)}`
      ]},
      { title: fa?'۳. تولید تعادلی و منحنی IS':'3. Equilibrium output and IS curve', equations:[
        `Y^*=\\alpha A=${f(m.multiplier,3)}\\times ${f(A,2)}=${f(Y,2)}`,
        `r=\\frac{c_0+I_0+G}{b}-\\frac{1-c_1(1-t)}{b}Y`
      ]}
    ];
  }

  if (id === 'money') {
    const m = new MoneyMarketModel({ M:n(v.M),P:n(v.P),k:n(v.k),h:n(v.h),rFloor:n(v.rFloor),regime:s(v.regime) as any });
    const Y=n(v.Y), real=m.realMoneySupply;
    const sections:MathSection[]=[{title:fa?'۱. مانده حقیقی پول':'1. Real money balances',equations:[`\\frac{M}{P}=\\frac{${f(m.M,1)}}{${f(m.P,2)}}=${f(real,2)}`]}];
    if(m.regime==='classical'){
      sections.push({title:fa?'۲. حالت کلاسیک':'2. Classical special case',equations:[`\\frac{M^d}{P}=kY`,`kY=${f(m.k,2)}\\times ${f(Y,1)}=${f(m.k*Y,2)}`],note:fa?'در این حالت بازار پول نرخ بهره را تعیین نمی‌کند.':'In this case the money market does not determine the interest rate.'});
    } else {
      const raw=(m.k*Y-real)/m.h, eq=m.solveEquilibriumRate(Y);
      sections.push({title:fa?'۲. ترجیح نقدینگی':'2. Liquidity preference',equations:[`\\frac{M^d}{P}=kY-hr`,`r_{linear}=\\frac{kY-M/P}{h}=\\frac{${f(m.k,2)}(${f(Y,1)})-${f(real,2)}}{${f(m.h,0)}}=${f(raw,4)}`]});
      sections.push({title:fa?(m.regime==='liquidity_trap'?'۳. قید کف نرخ بهره':'۳. نرخ بهره تعادلی'):(m.regime==='liquidity_trap'?'3. Interest-rate floor':'3. Equilibrium interest rate'),equations:[m.regime==='liquidity_trap'?`r^*=\\max(r_{floor},r_{linear})=${f(eq,4)}\\quad(${p(eq)})`:`r^*=${f(eq,4)}\\quad(${p(eq)})`]});
    }
    return sections;
  }

  if (id === 'islm') {
    const m = new ISLMEngine({G:n(v.G),t:n(v.tax),M:n(v.M),P:n(v.P),rFloor:n(v.rFloor),regime:s(v.regime) as any});
    const e=m.solveEquilibrium();
    const out:MathSection[]=[
      {title:fa?'۱. منحنی IS':'1. IS curve',equations:[`Y=\\alpha(A-br)\\Rightarrow r=\\frac{A}{b}-\\frac{Y}{\\alpha b}`,`\\alpha=${f(m.multiplier,3)},\\qquad A=${f(m.autonomousSpending,2)}`]},
      {title:fa?'۲. منحنی LM':'2. LM curve',equations:[]},
    ];
    if(m.regime==='classical') out[1].equations.push(`\\frac{M}{P}=kY\\Rightarrow Y^*=\\frac{M/P}{k}=${f(e.Y,2)}`,`r^*=\\frac{A-Y^*/\\alpha}{b}=${f(e.r,4)}`);
    else if(m.regime==='liquidity_trap' && e.branch==='liquidity_trap') out[1].equations.push(`r^*=r_{floor}=${f(m.rFloor,4)}`,`Y^*=\\alpha(A-br_{floor})=${f(e.Y,2)}`);
    else out[1].equations.push(`r=\\frac{kY-M/P}{h}`,`Y^*=\\frac{A+(b/h)(M/P)}{1/\\alpha+bk/h}=${f(e.Y,2)}`,`r^*=${f(e.r,4)}\\quad(${p(e.r)})`);
    out.push({title:fa?'۳. اجزای تعادل':'3. Equilibrium components',equations:[`C=${f(e.C,2)},\\qquad I=${f(e.I,2)},\\qquad T=${f(e.T,2)}`,`G-T=${f(e.Deficit,2)}`]});
    return out;
  }

  if (id === 'adas') {
    const m=new ADASModel({A:n(v.A),M:n(v.M),costShock:n(v.z),PExpected:n(v.Pe),PPrevious:n(v.Pprev),lambdaSlope:n(v.lam)}), e=m.solveShortRunEquilibrium();
    const kappa=m.lambdaSlope*m.YPotential/m.PPrevious;
    return [
      {title:fa?'۱. تقاضای کل':'1. Aggregate demand',equations:[`\\gamma=\\frac{1}{1/\\alpha+bk/h}=${f(m.gamma,3)}`,`Y^{AD}(P)=\\gamma\\left[A+\\frac{b}{h}\\frac{M}{P}\\right]`]},
      {title:fa?'۲. عرضه کل کوتاه‌مدت':'2. Short-run aggregate supply',equations:[`P=P^e+\\lambda(Y-Y_n)+z`,`P=${f(m.PExpected,2)}+${f(m.lambdaSlope,4)}(Y-${f(m.YPotential,0)})${m.costShock>=0?'+':''}${f(m.costShock,2)}`]},
      {title:fa?'۳. تعادل کوتاه‌مدت':'3. Short-run equilibrium',equations:[`P^*=${f(e.P,3)},\\qquad Y^*=${f(e.Y,2)}`,`gap=100\\frac{Y^*-Y_n}{Y_n}=${f(e.Output_Gap,2)}\\%`,`\\pi=100\\left(\\frac{P^*}{P_{-1}}-1\\right)=${f(e.Inflation,2)}\\%`]},
      {title:fa?'۴. نمایش معادل فیلیپس':'4. Phillips-curve counterpart',equations:[`\\pi=\\pi^e+\\kappa\\,gap+u`,`\\kappa=${f(kappa,3)}`]}
    ];
  }

  if (id === 'open') {
    const m=new MundellFlemingModel({regime:s(v.regime) as any,G:n(v.G),M:n(v.M),rForeign:n(v.rf),YForeign:n(v.Yf),exchangeRate:n(v.epeg)}), e=m.solveEquilibrium();
    const out:MathSection[]=[
      {title:fa?'۱. ضریب فزاینده اقتصاد باز':'1. Open-economy multiplier',equations:[`\\alpha_o=\\frac{1}{1-c_1(1-t)+m_1}=${f(m.openMultiplier,3)}`]},
      {title:fa?'۲. تحرک کامل سرمایه':'2. Perfect capital mobility',equations:[`r=r^*=${p(m.rForeign)}`]}
    ];
    if(m.regime==='floating') out.push({title:fa?'۳. نرخ ارز شناور':'3. Floating exchange rate',equations:[`Y^*=\\frac{M/P+hr^*}{k}=${f(e.Y,2)}`,`e^*=${f(e.e,3)},\\qquad NX=${f(e.NX,2)}`]});
    else out.push({title:fa?'۳. نرخ ارز ثابت':'3. Fixed exchange rate',equations:[`Y^*=\\alpha_o[A(e_{peg})-br^*]=${f(e.Y,2)}`,`M_{required}=P(kY^*-hr^*)=${f(e.M,2)}`]});
    return out;
  }

  if (id === 'solow') {
    const m=new SolowModel({s:n(v.s),A:n(v.A),alpha:n(v.alpha),delta:n(v.delta),n:n(v.n),g:n(v.g)}), ss=m.solveSteadyState();
    return [
      {title:fa?'۱. وضعیت پایدار':'1. Steady state',equations:[`\\Delta k=sAk^{\\alpha}-(\\delta+n+g)k`,`k^*=\\left(\\frac{sA}{\\delta+n+g}\\right)^{\\frac{1}{1-\\alpha}}=${f(ss.k_star,3)}`,`y^*=${f(ss.y_star,3)},\\qquad i^*=${f(ss.i_star,3)},\\qquad c^*=${f(ss.c_star,3)}`]},
      {title:fa?'۲. قاعده طلایی':'2. Golden Rule',equations:[`MPK=\\delta+n+g\\Rightarrow s_{gold}=\\alpha=${f(ss.s_gold,2)}`,`k_{gold}=${f(ss.k_gold,3)},\\qquad c_{gold}=${f(ss.c_gold,3)}`]}
    ];
  }

  if (id === 'taylor') {
    const m=new TaylorRuleModel({neutralRealRate:n(v.neutral),inflationTarget:n(v.target),inflationResponse:n(v.aPi),outputGapResponse:n(v.aY)}), pi=n(v.inflation), gap=n(v.gap), rate=m.policyRate(pi,gap), real=m.fisherRealRate(rate,pi);
    return [
      {title:fa?'۱. قاعده تیلور':'1. Taylor rule',equations:[`i=r^*+\\pi+a_{\\pi}(\\pi-\\pi^*)+a_y\\tilde y`,`i=${f(m.neutralRealRate,3)}+${f(pi,3)}+${f(m.inflationResponse,2)}(${f(pi,3)}-${f(m.inflationTarget,3)})+${f(m.outputGapResponse,2)}(${f(gap,3)})=${f(rate,4)}`]},
      {title:fa?'۲. نرخ بهره حقیقی تقریبی':'2. Approximate real interest rate',equations:[`r\\approx i-\\pi^e=${f(real,4)}\\quad(${p(real)})`]}
    ];
  }

  if (id === 'labor') {
    const m=new LaborMarketModel({productivity:n(v.productivity),markup:n(v.markup),wagePressure:n(v.wagePressure),wageSensitivity:n(v.wageSensitivity),okunBeta:n(v.okunBeta),outputGap:n(v.outputGap),laborForce:n(v.laborForce)}), e=m.solve();
    return [
      {title:fa?'۱. دستمزدگذاری و قیمت‌گذاری':'1. Wage setting and price setting',equations:[`\\left(\\frac{W}{P}\\right)_{WS}=A(1+z-\\beta_u u)`,`\\left(\\frac{W}{P}\\right)_{PS}=\\frac{A}{1+\\mu}=${f(e.real_wage_ps,3)}`]},
      {title:fa?'۲. نرخ بیکاری طبیعی':'2. Natural unemployment rate',equations:[`u_n=\\frac{1+z-1/(1+\\mu)}{\\beta_u}=${f(e.u_n,4)}\\quad(${p(e.u_n)})`]},
      {title:fa?'۳. قانون اوکان و اشتغال':'3. Okun’s law and employment',equations:[`u=u_n-\\beta_{Okun}\\tilde y`,`u=${f(e.u_n,4)}-${f(m.okunBeta,2)}(${f(m.outputGap,4)})=${f(e.u,4)}`,`N=L(1-u)=${f(m.laborForce,1)}(1-${f(e.u,4)})=${f(e.employment,2)}`]}
    ];
  }

  if (id === 'phillips') {
    const m=new ExpectationsPhillipsModel({expectedInflation:n(v.expectedInflation),unemployment:n(v.unemployment),naturalUnemployment:n(v.naturalUnemployment),alpha:n(v.alpha),supplyShock:n(v.supplyShock)}), e=m.solve();
    return [
      {title:fa?'۱. منحنی فیلیپس انتظارات‌افزوده':'1. Expectations-augmented Phillips curve',equations:[`\\pi=\\pi^e-\\alpha(u-u_n)+v`,`\\pi=${f(m.expectedInflation,4)}-${f(m.alpha,2)}(${f(m.unemployment,4)}-${f(m.naturalUnemployment,4)})+(${f(m.supplyShock,4)})=${f(e.inflation,4)}`]},
      {title:fa?'۲. تجزیه تورم':'2. Inflation decomposition',equations:[`\\pi^e=${p(e.expected_inflation)}`,`-\\alpha(u-u_n)=${(100*e.cyclical_component).toFixed(2)}\\text{ pp}`,`v=${(100*e.supply_shock).toFixed(2)}\\text{ pp}`]}
    ];
  }

  if (id === 'fiscal') {
    const m=new FiscalDebtModel({initialDebtRatio:n(v.initialDebtRatio),interestRate:n(v.interestRate),growthRate:n(v.growthRate),primaryBalance:n(v.primaryBalance),years:n(v.years)}), e=m.solve();
    return [
      {title:fa?'۱. معادله پویایی بدهی':'1. Debt-dynamics equation',equations:[`b_t=\\frac{1+r}{1+g}b_{t-1}-pb_t`,`b_1=\\frac{1+${f(m.interestRate,3)}}{1+${f(m.growthRate,3)}}(${f(m.initialDebtRatio,3)})-(${f(m.primaryBalance,3)})=${f(e.next_debt_ratio,4)}`]},
      {title:fa?'۲. اثر گلوله‌برفی و تراز تثبیت‌کننده':'2. Snowball effect and stabilizing primary balance',equations:[`r-g=${(100*e.r_minus_g).toFixed(2)}\\text{ pp}`,`pb^*=\\left(\\frac{1+r}{1+g}-1\\right)b=${(100*e.stabilizing_primary_balance).toFixed(2)}\\%\\,GDP`],note:fa?'در این قرارداد، مازاد اولیه مثبت و کسری اولیه منفی است.':'Under this sign convention, a primary surplus is positive and a primary deficit is negative.'}
    ];
  }

  if (id === 'transmission') {
    const m=new MonetaryTransmissionModel({policyShock:n(v.policyShock),passThrough:n(v.passThrough),policyPersistence:n(v.policyPersistence),outputPersistence:n(v.outputPersistence),demandSensitivity:n(v.demandSensitivity),inflationPersistence:n(v.inflationPersistence),phillipsSlope:n(v.phillipsSlope),investmentSensitivity:n(v.investmentSensitivity),consumptionSensitivity:n(v.consumptionSensitivity),quarters:n(v.quarters)}), e=m.solve();
    return [
      {title:fa?'۱. شوک نرخ و عبور به نرخ بازار':'1. Policy-rate shock and pass-through',equations:[`\\Delta i_t=${f(m.policyPersistence,2)}\\Delta i_{t-1}`,`\\Delta i_t^m=${f(m.passThrough,2)}\\Delta i_t`]},
      {title:fa?'۲. تقاضای کل و شکاف تولید':'2. Aggregate demand and output gap',equations:[`\\tilde y_t=${f(m.outputPersistence,2)}\\tilde y_{t-1}-${f(m.demandSensitivity,2)}\\Delta i^m_{t-1}`]},
      {title:fa?'۳. انتقال به تورم با وقفه':'3. Lagged transmission to inflation',equations:[`\\Delta\\pi_t=${f(m.inflationPersistence,2)}\\Delta\\pi_{t-1}+${f(m.phillipsSlope,2)}\\tilde y_{t-1}`],note:fa?`اوج واکنش تولید: ${e.peak_output_gap_pct.toFixed(2)}% در فصل ${e.peak_output_quarter} — اوج واکنش تورم: ${e.peak_inflation_gap_pp.toFixed(2)} واحد درصد در فصل ${e.peak_inflation_quarter}`:`Peak output response: ${e.peak_output_gap_pct.toFixed(2)}% in Q${e.peak_output_quarter}; peak inflation response: ${e.peak_inflation_gap_pp.toFixed(2)} pp in Q${e.peak_inflation_quarter}.`}
    ];
  }

  if (id === 'policy') {
    const result=runPolicyScenario(s(v.scenario) as any,n(v.intensity),s(v.exchangeRegime) as any);
    return [
      {title:fa?'ساختار آزمایشگاه سیاست‌گذاری':'Policy-lab structure',equations:[`\\text{Shock}\\;\\longrightarrow\\;IS\\text{-}LM\\;,\\;AD\\text{-}AS\\;,\\;Mundell\\text{-}Fleming`,`gap_{AD-AS}\\longrightarrow u\\longrightarrow\\pi\\longrightarrow i_{Taylor}\\longrightarrow\\text{Transmission}`],note:fa?`این بخش یک مدل ساختاری واحد با یک حل بسته نیست. شدت شوک جاری ${result.intensity.toFixed(2)} است و نتایج از چند مدل آموزشی به‌کمک فرض‌های پل‌زننده ساخته می‌شوند.`:`This section is not a single structural model with one closed-form solution. Current shock intensity is ${result.intensity.toFixed(2)} and results are connected through explicit bridge assumptions.`}
    ];
  }

  return [];
}
