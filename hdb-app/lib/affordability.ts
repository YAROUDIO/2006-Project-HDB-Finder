// HDB affordability helpers (place in /lib)
// Rules:
// - Interest (annual): 3.1% (CPF OA 3.0% + 0.1%)
// - LTV: up to 75% of lower(price, valuation)
// - Tenure (years): min(25, 65 - age, remainingLease - 20)
// - MSR: monthly repayment should be <= 30% of monthly income

export const HDB_INTEREST_ANNUAL_PCT = 3.1;
export const HDB_LTV = 0.75; // 75%
export const HDB_MSR_THRESHOLD = 0.30; // 30%
export const HDB_MAX_TENURE_YEARS = 25;

export type TenureResult = {
  tenureYears: number; // 0 if not eligible under tenure rules
  reasons: string[]; // textual notes of constraints applied
};

export function deriveTenure(age?: number, remainingLeaseYears?: number): TenureResult {
  const reasons: string[] = [];
  let t1 = HDB_MAX_TENURE_YEARS; // cap 25
  let t2 = Number.isFinite(age as number) ? Math.max(0, 65 - (age as number)) : Infinity;
  let t3 = Number.isFinite(remainingLeaseYears as number)
    ? Math.max(0, (remainingLeaseYears as number) - 20)
    : Infinity;

  if (!Number.isFinite(t2)) reasons.push("Age not provided: ignoring 65 - age cap");
  if (!Number.isFinite(t3)) reasons.push("Remaining lease not provided: ignoring (lease - 20) cap");

  const tenure = Math.min(t1, t2, t3);
  // Round down to whole years; require at least 1 year to consider eligible
  const tenureYears = Math.max(0, Math.floor(tenure));

  if (tenureYears === 0) {
    reasons.push("Tenure constraint results in < 1 year (not eligible)");
  }

  return { tenureYears, reasons };
}

export type LtvResult = {
  base: number; // min(price, valuation || price)
  loanAmount: number; // base * 75%
  downPayment: number; // price - loanAmount (>= 0)
};

export function calcLtvLoan(price: number, valuation?: number, ltv = HDB_LTV): LtvResult {
  const base = Math.min(price, Number.isFinite(valuation as number) ? (valuation as number) : price);
  const loanAmount = Math.max(0, base * ltv);
  const downPayment = Math.max(0, price - loanAmount);
  return { base, loanAmount, downPayment };
}

export function calcMonthlyPayment(loanAmount: number, annualInterestPct = HDB_INTEREST_ANNUAL_PCT, tenureYears: number) {
  const n = Math.floor(tenureYears * 12);
  if (n <= 0) return 0;
  const r = (annualInterestPct / 100) / 12;
  if (r === 0) return loanAmount / n;
  const pow = Math.pow(1 + r, n);
  return (loanAmount * r * pow) / (pow - 1);
}

export type EvaluateInput = {
  price: number; // total cost
  valuation?: number; // optional
  age?: number; // from userinfo
  remainingLeaseYears?: number; // from listing
  incomePerAnnum?: number; // from userinfo
  downPaymentBudget?: number; // from userinfo
  annualInterestPct?: number; // default 3.1
  ltvPct?: number; // default 75
};

export type EvaluateOutput = {
  price: number;
  base: number;
  loanAmount: number;
  downPayment: number;
  downPaymentBudget?: number;
  canAffordDownPayment?: boolean; // downPaymentBudget >= downPayment
  tenureYears: number; // 0 if not eligible
  monthlyRepayment: number;
  monthlyIncome?: number;
  msrLimit?: number; // 30% of monthlyIncome
  affordableMonthly?: boolean; // monthly <= msrLimit
  overallAffordable?: boolean; // both down payment AND monthly are affordable
  reasons: string[];
  // Helpful ratios
  incomeRatio?: number; // monthlyRepayment / monthlyIncome
  downPaymentScore?: number; // 1..10 based on down payment affordability
  monthlyScore?: number; // 1..10 based on monthly payment affordability
  score?: number; // min(downPaymentScore, monthlyScore) - overall affordability
};

export function scoreFromIncomeRatio(ratio: number, threshold = HDB_MSR_THRESHOLD): number {
  if (!Number.isFinite(ratio)) return 1;
  if (ratio <= threshold) return 10;
  const exceed = ratio - threshold;
  const step = 0.05; // every 5% above threshold drop 2 points
  const buckets = Math.ceil(exceed / step);
  const score = 10 - buckets * 2;
  return Math.min(10, Math.max(1, Math.round(score)));
}

// Score down payment affordability using Option B: Asymmetric approach
// Harsher below 100% (cannot afford), more generous above 100% (can afford)
export function scoreDownPaymentAffordability(downPaymentBudget: number, requiredDownPayment: number): number {
  if (!Number.isFinite(downPaymentBudget) || !Number.isFinite(requiredDownPayment) || requiredDownPayment <= 0) {
    return 1;
  }
  
  const ratio = downPaymentBudget / requiredDownPayment;
  
  // If you CAN afford (ratio >= 1.0)
  if (ratio >= 1.0) {
    if (ratio >= 2.0) return 10;  // 200%+ - double buffer!
    if (ratio >= 1.7) return 9;   // 170%
    if (ratio >= 1.4) return 8;   // 140%
    if (ratio >= 1.2) return 7;   // 120%
    if (ratio >= 1.05) return 6;  // 105% - small buffer
    return 5;                      // 100% - exactly meets requirement
  }
  
  // If you CANNOT afford (ratio < 1.0)
  if (ratio >= 0.95) return 4;  // 95% - short by 5%
  if (ratio >= 0.85) return 3;  // 85% - short by 15%
  if (ratio >= 0.70) return 2;  // 70% - short by 30%
  return 1;                      // < 70% - significantly short
}

export function evaluateAffordability(input: EvaluateInput): EvaluateOutput {
  const {
    price,
    valuation,
    age,
    remainingLeaseYears,
    incomePerAnnum,
    downPaymentBudget,
    annualInterestPct = HDB_INTEREST_ANNUAL_PCT,
    ltvPct = HDB_LTV,
  } = input;

  const reasons: string[] = [];

  const { base, loanAmount, downPayment } = calcLtvLoan(price, valuation, ltvPct);
  const { tenureYears, reasons: tenureNotes } = deriveTenure(age, remainingLeaseYears);
  reasons.push(...tenureNotes);

  const monthlyRepayment = calcMonthlyPayment(loanAmount, annualInterestPct, tenureYears);

  // Monthly payment affordability
  const monthlyIncome = Number.isFinite(incomePerAnnum as number) ? (incomePerAnnum as number) / 12 : undefined;
  const msrLimit = monthlyIncome !== undefined ? monthlyIncome * HDB_MSR_THRESHOLD : undefined;
  const affordableMonthly = msrLimit !== undefined ? monthlyRepayment <= msrLimit : undefined;

  const incomeRatio = monthlyIncome ? monthlyRepayment / monthlyIncome : undefined;
  const monthlyScore = incomeRatio !== undefined ? scoreFromIncomeRatio(incomeRatio) : undefined;

  // Down payment affordability
  const canAffordDownPayment = downPaymentBudget !== undefined ? downPaymentBudget >= downPayment : undefined;
  const downPaymentScore = downPaymentBudget !== undefined ? scoreDownPaymentAffordability(downPaymentBudget, downPayment) : undefined;

  // Overall affordability (both must be true)
  const overallAffordable = 
    affordableMonthly !== undefined && canAffordDownPayment !== undefined
      ? affordableMonthly && canAffordDownPayment
      : undefined;

  // Final score: minimum of both scores (you're only as affordable as your worst constraint)
  const score = 
    monthlyScore !== undefined && downPaymentScore !== undefined
      ? Math.min(monthlyScore, downPaymentScore)
      : monthlyScore ?? downPaymentScore;

  return {
    price,
    base,
    loanAmount,
    downPayment,
    downPaymentBudget,
    canAffordDownPayment,
    tenureYears,
    monthlyRepayment,
    monthlyIncome,
    msrLimit,
    affordableMonthly,
    overallAffordable,
    reasons,
    incomeRatio,
    downPaymentScore,
    monthlyScore,
    score,
  };
}

// Utility: parse price strings like "$500,000" -> 500000
export function parseCurrencyToNumber(v: string | number | undefined): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "number") return v;
  const num = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? num : undefined;
}

// Utility: parse remaining lease strings like "70 years 3 months" -> 70
export function parseRemainingLeaseYears(v: string | number | undefined): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "number") return v;
  const m = String(v).match(/(\d+)/);
  return m ? Number(m[1]) : undefined;
}
