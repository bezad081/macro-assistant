export type Regime = 'standard' | 'liquidity_trap' | 'classical';
export type ExchangeRegime = 'floating' | 'fixed';

export const clip = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const linspace = (start: number, stop: number, count: number): number[] => {
  if (count <= 1) return [start];
  const step = (stop - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + i * step);
};

export class GoodsMarketModel {
  c0 = 60; mpc = 0.75; t = 0.20; i0 = 140; b = 600; G = 120;
  constructor(values: Partial<GoodsMarketModel> = {}) { Object.assign(this, values); }
  get multiplier() {
    const denom = 1 - this.mpc * (1 - this.t);
    if (denom <= 0) throw new Error('The Keynesian multiplier is undefined for the selected parameters.');
    return 1 / denom;
  }
  investment(r: number) { return this.i0 - this.b * r; }
  autonomousSpending(r: number) { return this.c0 + this.investment(r) + this.G; }
  plannedExpenditure(Y: number, r: number) { return this.autonomousSpending(r) + this.mpc * (1 - this.t) * Y; }
  solveEquilibriumOutput(r: number) { return this.multiplier * this.autonomousSpending(r); }
  isCurveRate(Y: number) {
    const A = this.c0 + this.i0 + this.G;
    return A / this.b - ((1 - this.mpc * (1 - this.t)) / this.b) * Y;
  }
  inventoryPath(r: number, YStart: number, maxSteps = 16, tolerance = 0.25) {
    const x: number[] = [YStart], y: number[] = [YStart];
    let current = YStart;
    for (let i = 0; i < maxSteps; i++) {
      const z = this.plannedExpenditure(current, r);
      x.push(current, z); y.push(z, z);
      if (Math.abs(z - current) < tolerance) break;
      current = z;
    }
    return { x, y };
  }
}

export class MoneyMarketModel {
  M = 300; P = 1; k = 0.50; h = 4000; rFloor = 0.015; regime: Regime = 'standard';
  constructor(values: Partial<MoneyMarketModel> = {}) { Object.assign(this, values); }
  get realMoneySupply() { if (this.P <= 0) throw new Error('Price level must be positive.'); return this.M / this.P; }
  inverseMoneyDemand(realBalances: number, Y: number) {
    if (this.regime === 'classical') return NaN;
    const raw = (this.k * Y - realBalances) / this.h;
    return this.regime === 'liquidity_trap' ? Math.max(this.rFloor, raw) : raw;
  }
  solveEquilibriumRate(Y: number) {
    if (this.regime === 'classical') return NaN;
    const raw = (this.k * Y - this.realMoneySupply) / this.h;
    return this.regime === 'liquidity_trap' ? Math.max(this.rFloor, raw) : raw;
  }
  liquidityTrapKink(Y: number) { return this.k * Y - this.h * this.rFloor; }
}

export class ISLMEngine {
  c0 = 60; mpc = 0.75; t = 0.20; i0 = 140; b = 600; G = 120;
  M = 300; P = 1; k = 0.50; h = 4000; regime: Regime = 'standard'; rFloor = 0.015;
  constructor(values: Partial<ISLMEngine> = {}) { Object.assign(this, values); }
  get multiplier() { const d = 1 - this.mpc * (1 - this.t); if (d <= 0) throw new Error('Invalid multiplier parameters.'); return 1 / d; }
  get autonomousSpending() { return this.c0 + this.i0 + this.G; }
  get realMoneySupply() { return this.M / this.P; }
  get trapThresholdY() { return (this.realMoneySupply + this.h * this.rFloor) / this.k; }
  isCurve(Y: number) { return this.autonomousSpending / this.b - Y / (this.multiplier * this.b); }
  lmCurve(Y: number) {
    if (this.regime === 'classical') return NaN;
    const raw = (this.k * Y - this.realMoneySupply) / this.h;
    return this.regime === 'liquidity_trap' ? Math.max(this.rFloor, raw) : raw;
  }
  solveEquilibrium() {
    const alpha = this.multiplier, A = this.autonomousSpending, m = this.realMoneySupply;
    let Y: number, r: number, branch: string;
    if (this.regime === 'classical') {
      Y = m / this.k; r = (A - Y / alpha) / this.b; branch = 'classical';
    } else {
      const denom = 1 / alpha + this.b * this.k / this.h;
      const YLinear = (A + (this.b / this.h) * m) / denom;
      const rLinear = (this.k * YLinear - m) / this.h;
      if (this.regime === 'liquidity_trap' && rLinear < this.rFloor) {
        r = this.rFloor; Y = alpha * (A - this.b * r); branch = 'liquidity_trap';
      } else { Y = YLinear; r = rLinear; branch = 'normal'; }
    }
    const T = this.t * Y;
    const C = this.c0 + this.mpc * (Y - T);
    const I = this.i0 - this.b * r;
    return { Y, r, C, I, T, Deficit: this.G - T, branch };
  }
}

export class ADASModel {
  A = 430; alpha = 2.5; b = 600; h = 4000; k = 0.50; M = 300;
  YPotential = 1000; PExpected = 1; PPrevious = 1; lambdaSlope = 0.0015; costShock = 0;
  constructor(values: Partial<ADASModel> = {}) { Object.assign(this, values); }
  get gamma() { return 1 / ((1 / this.alpha) + (this.b * this.k / this.h)); }
  adOutput(P: number) { return this.gamma * (this.A + (this.b / this.h) * (this.M / P)); }
  srasPrice(Y: number) { return this.PExpected + this.lambdaSlope * (Y - this.YPotential) + this.costShock; }
  phillipsInflation(outputGapPct: number) {
    const expected = (this.PExpected / this.PPrevious - 1) * 100;
    const slope = this.lambdaSlope * this.YPotential / this.PPrevious;
    const shockPP = 100 * this.costShock / this.PPrevious;
    return expected + slope * outputGapPct + shockPP;
  }
  solveShortRunEquilibrium() {
    if (this.PPrevious <= 0) throw new Error('Previous-period price level must be positive.');
    const B = this.PExpected + this.lambdaSlope * (this.gamma * this.A - this.YPotential) + this.costShock;
    const C = this.lambdaSlope * this.gamma * (this.b / this.h) * this.M;
    const discriminant = B * B + 4 * C;
    if (discriminant < 0) throw new Error('No real-valued short-run equilibrium for selected parameters.');
    const P = (B + Math.sqrt(discriminant)) / 2;
    if (P <= 0) throw new Error('The selected parameters imply a non-positive price level.');
    const Y = this.adOutput(P);
    const Output_Gap = (Y - this.YPotential) / this.YPotential * 100;
    const Inflation = (P / this.PPrevious - 1) * 100;
    const Expected_Inflation = (this.PExpected / this.PPrevious - 1) * 100;
    return { P, Y, Output_Gap, Inflation, Expected_Inflation };
  }
}

export class MundellFlemingModel {
  c0 = 60; mpc = 0.75; t = 0.20; i0 = 140; b = 800; G = 120; M = 300; P = 1;
  k = 0.50; h = 4000; YForeign = 1000; rForeign = 0.05; x0 = 140; x1 = 0.10;
  m0 = 50; m1 = 0.15; eta = 80; exchangeRate = 1; regime: ExchangeRegime = 'floating';
  constructor(values: Partial<MundellFlemingModel> = {}) { Object.assign(this, values); }
  get openMultiplier() { const d = 1 - this.mpc * (1 - this.t) + this.m1; if (d <= 0) throw new Error('Open-economy multiplier is undefined.'); return 1 / d; }
  autonomousSpendingAtE(e: number) { return this.c0 + this.i0 + this.G + this.x0 + this.x1 * this.YForeign - this.m0 + this.eta * e; }
  isCurve(Y: number, e: number) { return this.autonomousSpendingAtE(e) / this.b - Y / (this.openMultiplier * this.b); }
  lmCurve(Y: number, M: number) { return (this.k * Y - M / this.P) / this.h; }
  solveEquilibrium() {
    const r = this.rForeign, alpha = this.openMultiplier; let Y: number, e: number, M: number, feasible = true;
    if (this.regime === 'floating') {
      Y = (this.M / this.P + this.h * r) / this.k;
      const requiredA = Y / alpha + this.b * r;
      const baseWithoutE = this.c0 + this.i0 + this.G + this.x0 + this.x1 * this.YForeign - this.m0;
      e = (requiredA - baseWithoutE) / this.eta; feasible = e > 0; e = Math.max(0.01, e); M = this.M;
    } else {
      e = this.exchangeRate; Y = alpha * (this.autonomousSpendingAtE(e) - this.b * r);
      const realMRequired = this.k * Y - this.h * r; feasible = realMRequired >= 0; M = Math.max(0, realMRequired * this.P);
    }
    const Exports = this.x0 + this.x1 * this.YForeign + this.eta * e;
    const Imports = this.m0 + this.m1 * Y;
    return { Y, r, e, M, NX: Exports - Imports, Imports, Exports, feasible };
  }
}

export class SolowModel {
  A = 1; alpha = 0.35; s = 0.25; delta = 0.05; n = 0.02; g = 0.01;
  constructor(values: Partial<SolowModel> = {}) { Object.assign(this, values); }
  get breakEvenRate() { return this.delta + this.n + this.g; }
  production(k: number) { return this.A * Math.pow(k, this.alpha); }
  savings(k: number) { return this.s * this.production(k); }
  breakEvenInvestment(k: number) { return this.breakEvenRate * k; }
  solveSteadyState() {
    if (this.breakEvenRate <= 0 || !(this.alpha > 0 && this.alpha < 1) || this.s < 0 || this.s > 1) throw new Error('Invalid Solow parameters.');
    const k = Math.pow((this.s * this.A) / this.breakEvenRate, 1 / (1 - this.alpha));
    const y = this.production(k), i = this.s * y, c = y - i;
    const sGold = this.alpha;
    const kGold = Math.pow((sGold * this.A) / this.breakEvenRate, 1 / (1 - this.alpha));
    const yGold = this.production(kGold), cGold = yGold - this.breakEvenRate * kGold;
    return { k_star: k, y_star: y, i_star: i, c_star: c, s_gold: sGold, k_gold: kGold, c_gold: cGold };
  }
  transitionPath(k0: number, periods = 40) {
    let k = Math.max(1e-6, k0); const rows: number[][] = [];
    for (let t = 0; t <= periods; t++) {
      const y = this.production(k), i = this.s * y, c = y - i; rows.push([t, k, y, c]);
      k = Math.max(1e-6, k + i - this.breakEvenRate * k);
    }
    return rows;
  }
}

export class TaylorRuleModel {
  neutralRealRate = 0.02; inflationTarget = 0.02; inflationResponse = 0.50; outputGapResponse = 0.50;
  constructor(values: Partial<TaylorRuleModel> = {}) { Object.assign(this, values); }
  policyRate(inflation: number, outputGap: number) {
    return this.neutralRealRate + inflation + this.inflationResponse * (inflation - this.inflationTarget) + this.outputGapResponse * outputGap;
  }
  fisherRealRate(nominalRate: number, expectedInflation: number) { return nominalRate - expectedInflation; }
}

export class LaborMarketModel {
  productivity = 1; markup = 0.20; wagePressure = 0; wageSensitivity = 2.5; okunBeta = 0.50; outputGap = 0; laborForce = 100;
  constructor(values: Partial<LaborMarketModel> = {}) { Object.assign(this, values); }
  validate() {
    if (this.productivity <= 0 || this.markup < 0 || this.wageSensitivity <= 0 || this.okunBeta < 0 || this.laborForce <= 0) throw new Error('Invalid labor-market parameters.');
  }
  wageSettingWage(u: number) { this.validate(); return this.productivity * (1 + this.wagePressure - this.wageSensitivity * u); }
  get priceSettingWage() { this.validate(); return this.productivity / (1 + this.markup); }
  get naturalUnemployment() { this.validate(); return clip((1 + this.wagePressure - 1 / (1 + this.markup)) / this.wageSensitivity, 0, 0.50); }
  get actualUnemployment() { return clip(this.naturalUnemployment - this.okunBeta * this.outputGap, 0, 0.50); }
  get employment() { return this.laborForce * (1 - this.actualUnemployment); }
  get naturalEmployment() { return this.laborForce * (1 - this.naturalUnemployment); }
  solve() {
    const u_n = this.naturalUnemployment, u = this.actualUnemployment;
    return { u_n, u, cyclical_u: u - u_n, real_wage_ps: this.priceSettingWage, real_wage_ws_at_u: this.wageSettingWage(u), employment: this.employment, natural_employment: this.naturalEmployment, labor_force: this.laborForce, output_gap: this.outputGap };
  }
}

export class ExpectationsPhillipsModel {
  expectedInflation = 0.03; unemployment = 0.06; naturalUnemployment = 0.06; alpha = 0.60; supplyShock = 0;
  constructor(values: Partial<ExpectationsPhillipsModel> = {}) { Object.assign(this, values); }
  validate() { if (this.alpha < 0 || this.unemployment < 0 || this.unemployment > 0.5 || this.naturalUnemployment < 0 || this.naturalUnemployment > 0.5) throw new Error('Invalid Phillips-curve parameters.'); }
  inflation(u = this.unemployment) { this.validate(); return this.expectedInflation - this.alpha * (u - this.naturalUnemployment) + this.supplyShock; }
  solve() {
    const inflation = this.inflation(); const cyclical_component = -this.alpha * (this.unemployment - this.naturalUnemployment);
    return { inflation, expected_inflation: this.expectedInflation, unemployment: this.unemployment, natural_unemployment: this.naturalUnemployment, cyclical_component, supply_shock: this.supplyShock, unemployment_gap: this.unemployment - this.naturalUnemployment };
  }
}

export class FiscalDebtModel {
  initialDebtRatio = 0.60; interestRate = 0.04; growthRate = 0.03; primaryBalance = 0; years = 15;
  constructor(values: Partial<FiscalDebtModel> = {}) { Object.assign(this, values); }
  validate() { if (this.initialDebtRatio < 0 || this.growthRate <= -0.95 || this.years < 1) throw new Error('Invalid fiscal-debt parameters.'); }
  get snowballFactor() { this.validate(); return (1 + this.interestRate) / (1 + this.growthRate); }
  stabilizingPrimaryBalance(debtRatio = this.initialDebtRatio) { return (this.snowballFactor - 1) * debtRatio; }
  nextDebtRatio(debtRatio = this.initialDebtRatio) { return this.snowballFactor * debtRatio - this.primaryBalance; }
  path() {
    this.validate(); let b = this.initialDebtRatio; const rows: number[][] = [];
    for (let year = 0; year <= Math.floor(this.years); year++) {
      rows.push([year, b, this.interestRate * b, this.stabilizingPrimaryBalance(b)]);
      b = Math.max(0, this.snowballFactor * b - this.primaryBalance);
    }
    return rows;
  }
  solve() {
    const p = this.path();
    return { initial_debt_ratio: this.initialDebtRatio, final_debt_ratio: p[p.length - 1][1], change_debt_ratio: p[p.length - 1][1] - p[0][1], stabilizing_primary_balance: this.stabilizingPrimaryBalance(), next_debt_ratio: this.nextDebtRatio(), snowball_factor: this.snowballFactor, r_minus_g: this.interestRate - this.growthRate, primary_balance: this.primaryBalance };
  }
}

export class MonetaryTransmissionModel {
  policyShock = 0; passThrough = 0.85; policyPersistence = 0.75; outputPersistence = 0.65;
  demandSensitivity = 0.45; inflationPersistence = 0.65; phillipsSlope = 0.25;
  investmentSensitivity = 2; consumptionSensitivity = 0.50; quarters = 12;
  constructor(values: Partial<MonetaryTransmissionModel> = {}) { Object.assign(this, values); }
  validate() {
    for (const x of [this.passThrough, this.policyPersistence, this.outputPersistence, this.inflationPersistence]) if (x < 0 || x > 1.2) throw new Error('Persistence/pass-through outside teaching range.');
    if (this.demandSensitivity < 0 || this.phillipsSlope < 0 || this.quarters < 4) throw new Error('Invalid transmission parameters.');
  }
  path() {
    this.validate(); const n = Math.floor(this.quarters);
    const policy = Array(n + 1).fill(0), market = Array(n + 1).fill(0), output = Array(n + 1).fill(0), inflation = Array(n + 1).fill(0), investment = Array(n + 1).fill(0), consumption = Array(n + 1).fill(0);
    policy[0] = this.policyShock; market[0] = this.passThrough * policy[0]; investment[0] = -this.investmentSensitivity * market[0] * 100; consumption[0] = -this.consumptionSensitivity * market[0] * 100;
    for (let t = 1; t <= n; t++) {
      policy[t] = this.policyPersistence * policy[t - 1]; market[t] = this.passThrough * policy[t];
      output[t] = this.outputPersistence * output[t - 1] - this.demandSensitivity * market[t - 1];
      inflation[t] = this.inflationPersistence * inflation[t - 1] + this.phillipsSlope * output[t - 1];
      investment[t] = -this.investmentSensitivity * market[t] * 100; consumption[t] = -this.consumptionSensitivity * market[t] * 100;
    }
    return Array.from({ length: n + 1 }, (_, q) => [q, policy[q] * 100, market[q] * 100, output[q] * 100, inflation[q] * 100, investment[q], consumption[q]]);
  }
  solve() {
    const p = this.path();
    const extreme = (col: number, mode: 'min' | 'max' | 'abs') => p.reduce((best, row, i) => {
      const score = mode === 'abs' ? Math.abs(row[col]) : row[col];
      const bestScore = mode === 'abs' ? Math.abs(p[best][col]) : p[best][col];
      return mode === 'min' ? (score < bestScore ? i : best) : (score > bestScore ? i : best);
    }, 0);
    const outIdx = extreme(3, this.policyShock >= 0 ? 'min' : 'max');
    const piIdx = extreme(4, this.policyShock >= 0 ? 'min' : 'max');
    const marketIdx = extreme(2, 'abs'), invIdx = extreme(5, 'abs'), conIdx = extreme(6, 'abs');
    return { peak_market_rate_gap_pp: p[marketIdx][2], peak_output_gap_pct: p[outIdx][3], peak_output_quarter: p[outIdx][0], peak_inflation_gap_pp: p[piIdx][4], peak_inflation_quarter: p[piIdx][0], peak_investment_deviation_pct: p[invIdx][5], peak_consumption_deviation_pct: p[conIdx][6] };
  }
}

export const POLICY_SCENARIOS = {
  fiscal_expansion: { fa: 'انبساط مالی', en: 'Fiscal expansion' },
  fiscal_consolidation: { fa: 'تعدیل مالی', en: 'Fiscal consolidation' },
  monetary_expansion: { fa: 'انبساط پولی', en: 'Monetary expansion' },
  policy_tightening: { fa: 'انقباض سیاست پولی', en: 'Monetary policy tightening' },
  adverse_supply: { fa: 'شوک منفی عرضه', en: 'Adverse supply shock' },
  world_rate_hike: { fa: 'افزایش نرخ بهره جهانی', en: 'World interest-rate hike' },
  productivity: { fa: 'بهبود بهره‌وری و ظرفیت تولید', en: 'Productivity and capacity improvement' },
  expectations: { fa: 'افزایش انتظارات تورمی', en: 'Higher inflation expectations' },
  markup_shock: { fa: 'افزایش مارک‌آپ و فشار قیمت‌گذاری', en: 'Markup and price-setting shock' },
} as const;
export type PolicyScenarioId = keyof typeof POLICY_SCENARIOS;

export function runPolicyScenario(scenarioId: PolicyScenarioId, intensity = 1, exchangeRegime: ExchangeRegime = 'floating') {
  const q = clip(intensity, 0.25, 2);
  const baseISLM = new ISLMEngine(), curISLM = new ISLMEngine({ ...baseISLM });
  const baseADAS = new ADASModel(), curADAS = new ADASModel({ ...baseADAS });
  const baseOpen = new MundellFlemingModel({ regime: exchangeRegime }), curOpen = new MundellFlemingModel({ ...baseOpen });
  const baseSolow = new SolowModel(), curSolow = new SolowModel({ ...baseSolow });
  const baseFiscal = new FiscalDebtModel(), curFiscal = new FiscalDebtModel({ ...baseFiscal });
  const baseLabor = new LaborMarketModel(), curLabor = new LaborMarketModel({ ...baseLabor });
  let directTransmissionShock: number | null = null;
  if (scenarioId === 'fiscal_expansion') { curISLM.G += 60*q; curADAS.A += 45*q; curOpen.G += 60*q; curFiscal.primaryBalance -= 0.02*q; }
  else if (scenarioId === 'fiscal_consolidation') { curISLM.G -= 30*q; curADAS.A -= 25*q; curOpen.G -= 30*q; curFiscal.primaryBalance += 0.025*q; }
  else if (scenarioId === 'monetary_expansion') { curISLM.M += 100*q; curADAS.M += 100*q; curOpen.M += 100*q; directTransmissionShock = -0.02*q; }
  else if (scenarioId === 'policy_tightening') { curISLM.M = Math.max(50, curISLM.M - 75*q); curADAS.M = Math.max(50, curADAS.M - 75*q); curOpen.M = Math.max(50, curOpen.M - 75*q); directTransmissionShock = 0.02*q; }
  else if (scenarioId === 'adverse_supply') curADAS.costShock += 0.10*q;
  else if (scenarioId === 'world_rate_hike') { curOpen.rForeign += 0.015*q; curFiscal.interestRate += 0.015*q; }
  else if (scenarioId === 'productivity') { curSolow.A += 0.25*q; curADAS.YPotential += 100*q; curLabor.productivity += 0.15*q; }
  else if (scenarioId === 'expectations') curADAS.PExpected += 0.10*q;
  else if (scenarioId === 'markup_shock') { curLabor.markup += 0.10*q; curADAS.costShock += 0.04*q; }

  const islm0 = baseISLM.solveEquilibrium(), islm1 = curISLM.solveEquilibrium();
  const adas0 = baseADAS.solveShortRunEquilibrium(), adas1 = curADAS.solveShortRunEquilibrium();
  const open0 = baseOpen.solveEquilibrium(), open1 = curOpen.solveEquilibrium();
  const solow0 = baseSolow.solveSteadyState(), solow1 = curSolow.solveSteadyState();
  baseLabor.outputGap = adas0.Output_Gap / 100; curLabor.outputGap = adas1.Output_Gap / 100;
  const labor0 = baseLabor.solve(), labor1 = curLabor.solve();
  const basePhillips = new ExpectationsPhillipsModel({ expectedInflation: adas0.Expected_Inflation / 100, unemployment: labor0.u, naturalUnemployment: labor0.u_n, alpha: 0.60, supplyShock: baseADAS.costShock / baseADAS.PPrevious });
  const curPhillips = new ExpectationsPhillipsModel({ expectedInflation: adas1.Expected_Inflation / 100, unemployment: labor1.u, naturalUnemployment: labor1.u_n, alpha: 0.60, supplyShock: curADAS.costShock / curADAS.PPrevious });
  const phillips0 = basePhillips.solve(), phillips1 = curPhillips.solve();
  const baseTaylor = new TaylorRuleModel(), curTaylor = new TaylorRuleModel();
  const taylor0 = baseTaylor.policyRate(adas0.Inflation/100, adas0.Output_Gap/100), taylor1 = curTaylor.policyRate(adas1.Inflation/100, adas1.Output_Gap/100);
  const baseTransmission = new MonetaryTransmissionModel({ policyShock: 0 });
  const transmissionShock = directTransmissionShock ?? (taylor1 - taylor0);
  const curTransmission = new MonetaryTransmissionModel({ policyShock: transmissionShock });
  const transmission0 = baseTransmission.solve(), transmission1 = curTransmission.solve();
  const fiscal0 = baseFiscal.solve(), fiscal1 = curFiscal.solve();
  return {
    scenarioId, intensity: q, exchangeRegime,
    islm: { base: islm0, current: islm1 }, adas: { base: adas0, current: adas1 }, open: { base: open0, current: open1 }, solow: { base: solow0, current: solow1 }, labor: { base: labor0, current: labor1 }, phillips: { base: phillips0, current: phillips1 }, fiscal: { base: fiscal0, current: fiscal1 }, taylor: { baseRate: taylor0, currentRate: taylor1 }, transmission: { base: transmission0, current: transmission1 }
  };
}
