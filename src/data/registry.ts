export type Lang = 'fa' | 'en';
export type Value = number | string | boolean;
export type ModelState = Record<string, Value>;
export type ParamSpec = {
  key: string;
  label: string;
  kind?: 'range' | 'select' | 'checkbox';
  min?: number; max?: number; step?: number;
  options?: { value: string; fa: string; en: string }[];
  percent?: boolean;
};
export type Preset = { fa: string; en: string; values: ModelState };
export type ChapterConfig = {
  id: string; icon: string; fa: string; en: string; subtitleFa: string; subtitleEn: string;
  params: ParamSpec[]; defaults: ModelState; presets: Record<string, Preset>; questionFa: string; questionEn: string;
};

const regimeOptions = [
  { value: 'standard', fa: 'استاندارد', en: 'Standard' },
  { value: 'liquidity_trap', fa: 'دام نقدینگی', en: 'Liquidity trap' },
  { value: 'classical', fa: 'کلاسیک', en: 'Classical' },
];
const fxOptions = [
  { value: 'floating', fa: 'شناور', en: 'Floating' },
  { value: 'fixed', fa: 'ثابت', en: 'Fixed' },
];

export const CHAPTERS: ChapterConfig[] = [
  {
    id: 'goods', icon: '📦', fa: 'بازار کالا و تقاطع کینزی', en: 'Goods Market & Keynesian Cross',
    subtitleFa: 'تقاطع کینزی، ضریب فزاینده، تعدیل موجودی و استخراج IS', subtitleEn: 'Keynesian cross, multiplier, inventory adjustment, and IS derivation',
    defaults: { c0: 60, mpc: .75, tax: .20, G: 120, r: .05, showPath: true },
    params: [
      {key:'c0',label:'c₀',min:20,max:160,step:5},{key:'mpc',label:'MPC',min:.30,max:.95,step:.05},
      {key:'tax',label:'t',min:0,max:.50,step:.05,percent:true},{key:'G',label:'G',min:40,max:260,step:10},
      {key:'r',label:'r',min:-.01,max:.15,step:.005,percent:true},{key:'showPath',label:'Adjustment path',kind:'checkbox'}
    ],
    presets: {
      baseline:{fa:'خط مبنا',en:'Baseline',values:{}}, fiscal:{fa:'سیاست مالی انبساطی',en:'Fiscal expansion',values:{G:190}},
      tax:{fa:'افزایش مالیات',en:'Tax-rate increase',values:{tax:.35}}, confidence:{fa:'افت مصرف خودمختار',en:'Autonomous-consumption drop',values:{c0:30}},
      rates:{fa:'افزایش نرخ بهره',en:'Interest-rate hike',values:{r:.10}},
    },
    questionFa:'پیش‌بینی کنید افزایش G منحنی مخارج و IS را به کدام سمت منتقل می‌کند و چرا.',
    questionEn:'Predict how higher G shifts planned expenditure and IS, and explain why.'
  },
  {
    id:'money',icon:'💵',fa:'بازار پول و ترجیح نقدینگی',en:'Money Market & Liquidity Preference',
    subtitleFa:'تقاضای پول، عرضه حقیقی پول و حالت‌های استاندارد، دام نقدینگی و کلاسیک',subtitleEn:'Money demand, real balances, and standard/liquidity-trap/classical cases',
    defaults:{regime:'standard',M:300,P:1,k:.5,h:4000,Y:1000,rFloor:.015},
    params:[{key:'regime',label:'Regime',kind:'select',options:regimeOptions},{key:'M',label:'M',min:100,max:700,step:25},{key:'P',label:'P',min:.5,max:2,step:.1},{key:'k',label:'k',min:.2,max:.8,step:.05},{key:'h',label:'h',min:1000,max:8000,step:500},{key:'Y',label:'Y',min:500,max:1600,step:50},{key:'rFloor',label:'r floor',min:0,max:.04,step:.005,percent:true}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},expansion:{fa:'افزایش عرضه پول',en:'Monetary expansion',values:{M:450}},boom:{fa:'افزایش درآمد',en:'Income boom',values:{Y:1300}},trap:{fa:'دام نقدینگی',en:'Liquidity trap',values:{regime:'liquidity_trap',M:500,rFloor:.015}},classical:{fa:'حالت خاص کلاسیک',en:'Classical special case',values:{regime:'classical'}}},
    questionFa:'ابتدا جهت تغییر نرخ بهره را حدس بزنید و سپس تفاوت سه رژیم نظری را مقایسه کنید.',questionEn:'Predict the interest-rate direction first, then compare the three theoretical cases.'
  },
  {
    id:'islm',icon:'⚖️',fa:'تعادل IS–LM',en:'IS–LM Equilibrium',subtitleFa:'تعادل همزمان بازار کالا و پول و تحلیل سیاست مالی/پولی',subtitleEn:'Joint goods-money equilibrium and fiscal/monetary policy analysis',
    defaults:{regime:'standard',G:120,tax:.2,M:300,P:1,rFloor:.015},
    params:[{key:'regime',label:'LM regime',kind:'select',options:regimeOptions},{key:'G',label:'G',min:40,max:260,step:10},{key:'tax',label:'t',min:0,max:.45,step:.05,percent:true},{key:'M',label:'M',min:100,max:600,step:25},{key:'P',label:'P',min:.6,max:1.8,step:.1},{key:'rFloor',label:'r floor',min:0,max:.04,step:.005,percent:true}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},fiscal:{fa:'افزایش مخارج دولت',en:'Government-spending increase',values:{G:190}},money:{fa:'افزایش عرضه پول',en:'Money-supply increase',values:{M:425}},mix:{fa:'ترکیب مالی انبساطی + پولی انقباضی',en:'Fiscal expansion + monetary tightening',values:{G:190,M:225}},trap:{fa:'دام نقدینگی',en:'Liquidity trap',values:{regime:'liquidity_trap',M:500,rFloor:.015}},classical:{fa:'LM عمودی',en:'Vertical LM',values:{regime:'classical'}}},
    questionFa:'اثر شوک را ابتدا روی IS یا LM و سپس روی Y، r و سرمایه‌گذاری خصوصی پیش‌بینی کنید.',questionEn:'Predict the shock first on IS/LM, then on Y, r, and private investment.'
  },
  {
    id:'adas',icon:'📈',fa:'AD–AS و منحنی فیلیپس',en:'AD–AS & Phillips Curve',subtitleFa:'تعادل کوتاه‌مدت، شکاف تولید، تورم و شوک‌های تقاضا/عرضه',subtitleEn:'Short-run equilibrium, output gap, inflation, and demand/supply shocks',
    defaults:{A:430,M:300,z:0,Pe:1,Pprev:1,lam:.0015},
    params:[{key:'A',label:'A',min:250,max:600,step:10},{key:'M',label:'M',min:100,max:650,step:25},{key:'z',label:'z',min:-.25,max:.5,step:.05},{key:'Pe',label:'Pᵉ',min:.7,max:1.5,step:.05},{key:'Pprev',label:'P₋₁',min:.7,max:1.5,step:.05},{key:'lam',label:'λ',min:.0005,max:.003,step:.00025}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},boom:{fa:'شوک مثبت تقاضا',en:'Positive demand shock',values:{A:500}},money:{fa:'انبساط پولی',en:'Monetary expansion',values:{M:425}},oil:{fa:'شوک منفی عرضه / انرژی',en:'Adverse supply / energy shock',values:{z:.15}},expect:{fa:'افزایش انتظارات قیمتی',en:'Higher price expectations',values:{Pe:1.12}}},
    questionFa:'مشخص کنید شوک از سمت AD است یا SRAS و تورم و شکاف تولید هم‌جهت حرکت می‌کنند یا خلاف جهت.',questionEn:'Identify whether the shock acts through AD or SRAS and whether inflation and the output gap move together.'
  },
  {
    id:'open',icon:'🌍',fa:'اقتصاد باز و ماندل–فلمینگ',en:'Open Economy & Mundell–Fleming',subtitleFa:'تحرک کامل سرمایه، نرخ ارز شناور/ثابت و سیاست‌های کلان',subtitleEn:'Perfect capital mobility, floating/fixed FX, and macro policies',
    defaults:{regime:'floating',G:120,M:300,rf:.05,Yf:1000,epeg:1},
    params:[{key:'regime',label:'FX regime',kind:'select',options:fxOptions},{key:'G',label:'G',min:50,max:250,step:10},{key:'M',label:'M',min:100,max:600,step:25},{key:'rf',label:'r*',min:.01,max:.08,step:.005,percent:true},{key:'Yf',label:'Y foreign',min:700,max:1400,step:50},{key:'epeg',label:'e peg',min:.5,max:2,step:.05}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},fiscal:{fa:'سیاست مالی در ارز شناور',en:'Fiscal expansion under floating FX',values:{regime:'floating',G:190}},money:{fa:'سیاست پولی در ارز شناور',en:'Monetary expansion under floating FX',values:{regime:'floating',M:425}},world:{fa:'افزایش نرخ بهره جهانی',en:'World interest-rate increase',values:{rf:.07}},fixed:{fa:'سیاست مالی با نرخ ارز ثابت',en:'Fiscal expansion under fixed FX',values:{regime:'fixed',G:190,epeg:1}}},
    questionFa:'در رژیم شناور و ثابت، متغیر تعدیل‌کننده را مشخص کنید: نرخ ارز یا عرضه پول؟',questionEn:'Under floating and fixed exchange rates, identify the adjusting variable: exchange rate or money supply.'
  },
  {
    id:'solow',icon:'🌱',fa:'رشد بلندمدت و مدل سولو',en:'Long-Run Growth & Solow Model',subtitleFa:'وضعیت پایدار، قاعده طلایی و مسیر گذار سرمایه',subtitleEn:'Steady state, golden rule, and capital transition path',
    defaults:{s:.25,A:1,alpha:.35,delta:.05,n:.02,g:.01},params:[{key:'s',label:'s',min:.05,max:.6,step:.05,percent:true},{key:'A',label:'A',min:.6,max:2.2,step:.1},{key:'alpha',label:'α',min:.2,max:.5,step:.05},{key:'delta',label:'δ',min:.02,max:.12,step:.01,percent:true},{key:'n',label:'n',min:0,max:.05,step:.005,percent:true},{key:'g',label:'g',min:0,max:.04,step:.005,percent:true}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},saving:{fa:'افزایش نرخ پس‌انداز',en:'Higher saving rate',values:{s:.4}},productivity:{fa:'بهبود بهره‌وری',en:'Productivity improvement',values:{A:1.35}},population:{fa:'افزایش رشد جمعیت',en:'Higher population growth',values:{n:.04}},depreciation:{fa:'استهلاک بیشتر',en:'Higher depreciation',values:{delta:.09}}},
    questionFa:'کدام تغییر فقط سطح وضعیت پایدار را تغییر می‌دهد و کدام پارامترها بر رشد بلندمدت اثر دارند؟',questionEn:'Which changes alter only steady-state levels, and which parameters affect long-run growth?' 
  },
  {
    id:'taylor',icon:'🏦',fa:'قاعده تیلور و سیاست پولی',en:'Taylor Rule & Monetary Policy',subtitleFa:'واکنش نرخ سیاستی به تورم و شکاف تولید',subtitleEn:'Policy-rate response to inflation and the output gap',
    defaults:{inflation:.04,gap:0,neutral:.02,target:.02,aPi:.5,aY:.5},params:[{key:'inflation',label:'π',min:-.02,max:.12,step:.005,percent:true},{key:'gap',label:'Output gap',min:-.08,max:.08,step:.005,percent:true},{key:'neutral',label:'r* neutral',min:0,max:.05,step:.005,percent:true},{key:'target',label:'π* target',min:0,max:.06,step:.005,percent:true},{key:'aPi',label:'aπ',min:0,max:1.5,step:.1},{key:'aY',label:'ay',min:0,max:1.5,step:.1}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},inflation:{fa:'جهش تورم',en:'Inflation surge',values:{inflation:.08}},recession:{fa:'شکاف تولید منفی',en:'Negative output gap',values:{gap:-.05,inflation:.015}},hot:{fa:'داغ‌شدن اقتصاد',en:'Overheating',values:{gap:.05,inflation:.06}},hawk:{fa:'واکنش قوی‌تر به تورم',en:'Stronger inflation response',values:{aPi:1.2}}},
    questionFa:'جهت نرخ سیاستی را پیش‌بینی کنید و نقش ضرایب واکنش به تورم و شکاف تولید را جدا کنید.',questionEn:'Predict the policy-rate direction and isolate the roles of inflation and output-gap coefficients.'
  },
  {
    id:'labor',icon:'👷',fa:'بازار کار، بیکاری و قانون اوکان',en:'Labor Market, Unemployment & Okun’s Law',subtitleFa:'چارچوب WS–PS و پیوند شکاف تولید با بیکاری ادواری',subtitleEn:'WS–PS framework and the output-gap/cyclical-unemployment link',
    defaults:{productivity:1,markup:.2,wagePressure:0,wageSensitivity:2.5,okunBeta:.5,outputGap:0,laborForce:100},params:[{key:'productivity',label:'A',min:.5,max:2,step:.05},{key:'markup',label:'μ',min:0,max:.5,step:.05},{key:'wagePressure',label:'z',min:-.05,max:.12,step:.01},{key:'wageSensitivity',label:'βu',min:2,max:5,step:.25},{key:'okunBeta',label:'β Okun',min:.1,max:1,step:.05},{key:'outputGap',label:'Output gap',min:-.1,max:.1,step:.005,percent:true},{key:'laborForce',label:'Labor force',min:50,max:200,step:5}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},recession:{fa:'رکود و شکاف تولید منفی',en:'Recession / negative output gap',values:{outputGap:-.05}},boom:{fa:'رونق و شکاف تولید مثبت',en:'Boom / positive output gap',values:{outputGap:.05}},markup:{fa:'افزایش مارک‌آپ بنگاه‌ها',en:'Higher firm markup',values:{markup:.35}},wage:{fa:'افزایش فشار دستمزدی',en:'Higher wage-setting pressure',values:{wagePressure:.08}}},
    questionFa:'اثر مارک‌آپ، فشار دستمزدی و شکاف تولید را بر بیکاری طبیعی و ادواری جداگانه توضیح دهید.',questionEn:'Separate the effects of markup, wage pressure, and the output gap on natural and cyclical unemployment.'
  },
  {
    id:'phillips',icon:'📉',fa:'منحنی فیلیپس انتظارات‌افزوده',en:'Expectations-Augmented Phillips Curve',subtitleFa:'تورم مورد انتظار، شکاف بیکاری و شوک عرضه',subtitleEn:'Expected inflation, unemployment gap, and supply shocks',
    defaults:{expectedInflation:.03,unemployment:.06,naturalUnemployment:.06,alpha:.6,supplyShock:0},params:[{key:'expectedInflation',label:'πᵉ',min:-.02,max:.15,step:.005,percent:true},{key:'unemployment',label:'u',min:0,max:.2,step:.005,percent:true},{key:'naturalUnemployment',label:'uₙ',min:.01,max:.15,step:.005,percent:true},{key:'alpha',label:'α',min:0,max:2,step:.1},{key:'supplyShock',label:'v',min:-.05,max:.1,step:.005,percent:true}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},boom:{fa:'بیکاری زیر نرخ طبیعی',en:'Unemployment below natural rate',values:{unemployment:.035}},recession:{fa:'بیکاری بالاتر از نرخ طبیعی',en:'Unemployment above natural rate',values:{unemployment:.09}},expect:{fa:'افزایش انتظارات تورمی',en:'Higher inflation expectations',values:{expectedInflation:.07}},supply:{fa:'شوک تورمی عرضه',en:'Inflationary supply shock',values:{supplyShock:.03}}},
    questionFa:'کدام شوک حرکت روی SRPC ایجاد می‌کند و کدام شوک کل منحنی را جابه‌جا می‌کند؟',questionEn:'Which shocks move the economy along the SRPC, and which shift the entire curve?'
  },
  {
    id:'fiscal',icon:'🏛️',fa:'سیاست مالی و پویایی بدهی دولت',en:'Fiscal Policy & Government Debt Dynamics',subtitleFa:'اثر r−g، تراز اولیه و مسیر نسبت بدهی به GDP',subtitleEn:'The role of r−g, primary balance, and the debt-to-GDP path',
    defaults:{initialDebtRatio:.6,interestRate:.04,growthRate:.03,primaryBalance:0,years:15},params:[{key:'initialDebtRatio',label:'Initial debt / GDP',min:0,max:2,step:.05,percent:true},{key:'interestRate',label:'r',min:-.02,max:.15,step:.005,percent:true},{key:'growthRate',label:'g',min:-.1,max:.15,step:.005,percent:true},{key:'primaryBalance',label:'Primary balance / GDP',min:-.1,max:.1,step:.005,percent:true},{key:'years',label:'Horizon (years)',min:5,max:40,step:1}],
    presets:{baseline:{fa:'خط مبنا',en:'Baseline',values:{}},deficit:{fa:'کسری اولیه ۳٪ GDP',en:'3% of GDP primary deficit',values:{primaryBalance:-.03}},interest:{fa:'شوک نرخ بهره',en:'Interest-rate shock',values:{interestRate:.08}},growth:{fa:'رشد اقتصادی بالاتر',en:'Higher economic growth',values:{growthRate:.06}},consolidation:{fa:'تعدیل مالی / مازاد اولیه',en:'Fiscal consolidation / primary surplus',values:{primaryBalance:.025}},debt:{fa:'بدهی اولیه بالا',en:'High initial debt',values:{initialDebtRatio:1}}},
    questionFa:'با علامت r−g پیش‌بینی کنید نسبت بدهی با تراز اولیه ثابت میل به افزایش دارد یا کاهش.',questionEn:'Use the sign of r−g to predict whether debt/GDP tends to rise or fall with an unchanged primary balance.'
  },
  {
    id:'transmission',icon:'🔄',fa:'سازوکار انتقال سیاست پولی',en:'Monetary Policy Transmission',subtitleFa:'مسیر زمانی نرخ بازار، تولید، تورم، سرمایه‌گذاری و مصرف',subtitleEn:'Dynamic path of market rates, output, inflation, investment, and consumption',
    defaults:{policyShock:0,passThrough:.85,policyPersistence:.75,outputPersistence:.65,demandSensitivity:.45,inflationPersistence:.65,phillipsSlope:.25,investmentSensitivity:2,consumptionSensitivity:.5,quarters:12},params:[{key:'policyShock',label:'Policy-rate shock',min:-.05,max:.05,step:.005,percent:true},{key:'passThrough',label:'Pass-through φ',min:.2,max:1.2,step:.05},{key:'policyPersistence',label:'Policy persistence ρᵢ',min:0,max:1,step:.05},{key:'outputPersistence',label:'Output persistence ρᵧ',min:0,max:1,step:.05},{key:'demandSensitivity',label:'Demand sensitivity σ',min:.05,max:1,step:.05},{key:'inflationPersistence',label:'Inflation persistence ρπ',min:0,max:1,step:.05},{key:'phillipsSlope',label:'Phillips slope κ',min:.05,max:.8,step:.05},{key:'investmentSensitivity',label:'Investment sensitivity',min:.5,max:4,step:.25},{key:'consumptionSensitivity',label:'Consumption sensitivity',min:.1,max:2,step:.1},{key:'quarters',label:'Horizon (quarters)',min:8,max:24,step:1}],
    presets:{baseline:{fa:'بدون شوک نرخ سیاستی',en:'No policy-rate shock',values:{}},tight:{fa:'انقباض پولی: +۲ واحد درصد',en:'Monetary tightening: +2 pp',values:{policyShock:.02}},strong:{fa:'انقباض شدید: +۴ واحد درصد',en:'Strong tightening: +4 pp',values:{policyShock:.04}},ease:{fa:'انبساط پولی: −۲ واحد درصد',en:'Monetary easing: -2 pp',values:{policyShock:-.02}},weak:{fa:'انتقال ضعیف نرخ سیاستی',en:'Weak interest-rate pass-through',values:{policyShock:.02,passThrough:.4}}},
    questionFa:'ترتیب زمانی واکنش نرخ بازار، سرمایه‌گذاری، تولید و تورم به شوک نرخ سیاستی را پیش‌بینی کنید.',questionEn:'Predict the timing of market-rate, investment, output, and inflation responses to a policy-rate shock.'
  },
  {
    id:'policy',icon:'🧪',fa:'آزمایشگاه سیاست‌گذاری بین‌مدلی',en:'Cross-Model Policy Lab',subtitleFa:'یک شوک، چند چارچوب؛ مقایسه شفاف پیامدها و فرض‌های پل‌زننده',subtitleEn:'One shock across multiple frameworks with transparent bridge assumptions',
    defaults:{scenario:'fiscal_expansion',intensity:1,exchangeRegime:'floating'},
    params:[{key:'scenario',label:'Scenario',kind:'select',options:[
      {value:'fiscal_expansion',fa:'انبساط مالی',en:'Fiscal expansion'},{value:'fiscal_consolidation',fa:'تعدیل مالی',en:'Fiscal consolidation'},{value:'monetary_expansion',fa:'انبساط پولی',en:'Monetary expansion'},{value:'policy_tightening',fa:'انقباض سیاست پولی',en:'Monetary policy tightening'},{value:'adverse_supply',fa:'شوک منفی عرضه',en:'Adverse supply shock'},{value:'world_rate_hike',fa:'افزایش نرخ بهره جهانی',en:'World interest-rate hike'},{value:'productivity',fa:'بهبود بهره‌وری و ظرفیت',en:'Productivity/capacity improvement'},{value:'expectations',fa:'افزایش انتظارات تورمی',en:'Higher inflation expectations'},{value:'markup_shock',fa:'شوک مارک‌آپ',en:'Markup shock'}
    ]},{key:'intensity',label:'Shock intensity',min:.25,max:2,step:.25},{key:'exchangeRegime',label:'FX regime',kind:'select',options:fxOptions}],
    presets:{baseline:{fa:'سناریوی پایه',en:'Baseline scenario',values:{scenario:'fiscal_expansion',intensity:1,exchangeRegime:'floating'}}},
    questionFa:'کدام نتایج از خود مدل‌ها می‌آیند و کدام نتیجه وابسته به فرض‌های پل‌زننده بین مدل‌هاست؟',questionEn:'Which results come from each model directly, and which depend on bridge assumptions between models?'
  }
];

export const chapterById = (id: string) => CHAPTERS.find(c => c.id === id) ?? CHAPTERS[0];
