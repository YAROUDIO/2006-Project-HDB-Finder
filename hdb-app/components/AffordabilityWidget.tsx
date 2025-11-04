"use client";

import { useEffect, useMemo, useState } from "react";
import {
  evaluateAffordability,
  parseCurrencyToNumber,
  HDB_INTEREST_ANNUAL_PCT,
} from "../lib/affordability";

export type AffordabilityWidgetProps = {
  price: number | string; // listing price (e.g. 500000 or "$500,000")
  remainingLeaseYears?: number; // numeric years if available
  valuation?: number; // optional
  // Optional UI overrides
  showControls?: boolean; // if true, allow editing interest/valuation
  onMissingUserInfo?: () => void; // callback when age or income is missing
};

export default function AffordabilityWidget({
  price,
  remainingLeaseYears,
  valuation,
  showControls = false,
  onMissingUserInfo,
}: AffordabilityWidgetProps) {
  const [age, setAge] = useState<number | undefined>(undefined);
  const [incomePerAnnum, setIncomePerAnnum] = useState<number | undefined>(undefined);
  const [downPaymentBudget, setDownPaymentBudget] = useState<number | undefined>(undefined);
  const [annualInterestPct, setAnnualInterestPct] = useState<number>(HDB_INTEREST_ANNUAL_PCT);
  const [val, setVal] = useState<number | undefined>(valuation);
  const [hasCheckedUserInfo, setHasCheckedUserInfo] = useState(false);

  // Prefill from /api/userinfo
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/userinfo", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          const u = data?.user ?? data?.data ?? {};
          // Try multiple key shapes to be resilient
          const ageRaw = u.age ?? u.Age ?? u.user_age;
          // The 'income' field in our DB is yearly household income
          const annualIncomeRaw =
            u.incomePerAnnum ?? u.annualIncome ?? u.income_per_annum ?? u.total_income_per_annum ?? u.incomeYearly ?? u.income;
          const downPaymentBudgetRaw = u.downPaymentBudget ?? u.down_payment_budget;

          const parsedAge = Number(ageRaw);
          const parsedAnnual = Number(annualIncomeRaw);
          const parsedDownPaymentBudget = Number(downPaymentBudgetRaw);

          if (Number.isFinite(parsedAge)) setAge(parsedAge);
          if (Number.isFinite(parsedAnnual)) setIncomePerAnnum(parsedAnnual);
          if (Number.isFinite(parsedDownPaymentBudget)) setDownPaymentBudget(parsedDownPaymentBudget);
          
          setHasCheckedUserInfo(true);
          
          // Trigger callback if age or income is missing
          if (onMissingUserInfo) {
            const missingAge = !Number.isFinite(parsedAge);
            const missingIncome = !Number.isFinite(parsedAnnual);
            if (missingAge || missingIncome) {
              onMissingUserInfo();
            }
          }
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [onMissingUserInfo]);

  const priceNum = useMemo(() => parseCurrencyToNumber(price) ?? 0, [price]);

  const result = useMemo(
    () =>
      evaluateAffordability({
        price: priceNum,
        valuation: val,
        age,
        remainingLeaseYears,
        incomePerAnnum,
        downPaymentBudget,
        annualInterestPct,
      }),
    [priceNum, val, age, remainingLeaseYears, incomePerAnnum, downPaymentBudget, annualInterestPct]
  );

  const fmtMoney = (n: number | undefined, d = 2) =>
    n === undefined ? "-" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

  const badge = () => {
    if (result.overallAffordable === undefined) return (
      <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">Need info to check</span>
    );
    return result.overallAffordable ? (
      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">✓ Affordable</span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">✗ Not affordable</span>
    );
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-blue-900 m-0">Affordability</h3>
        {badge()}
      </div>

      {showControls && (
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <label className="text-slate-700">Interest (annual %)</label>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={annualInterestPct}
            onChange={(e) => setAnnualInterestPct(Number(e.target.value))}
            step="0.01"
            min={0}
          />

          <label className="text-slate-700">Valuation (optional)</label>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={val ?? ""}
            onChange={(e) => setVal(e.target.value === "" ? undefined : Number(e.target.value))}
            min={0}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div className="text-slate-600">Down payment required</div>
        <div className="text-slate-900">${fmtMoney(result.downPayment, 0)}</div>

        <div className="text-slate-600">Down payment budget</div>
        <div className="text-slate-900">
          {result.downPaymentBudget !== undefined ? `$${fmtMoney(result.downPaymentBudget, 0)}` : "-"}
        </div>

        {result.canAffordDownPayment !== undefined && (
          <>
            <div className="text-slate-600">Can afford down payment</div>
            <div>
              {result.canAffordDownPayment ? (
                <span className="text-green-600">✓ Yes</span>
              ) : (
                <span className="text-red-600">✗ No</span>
              )}
            </div>
          </>
        )}

        <div className="text-slate-600">Tenure (years)</div>
        <div className="text-slate-900">{result.tenureYears > 0 ? result.tenureYears : "Not eligible"}</div>

        <div className="text-slate-600">Monthly repayment</div>
        <div className="text-slate-900">${fmtMoney(result.monthlyRepayment)}</div>

        <div className="text-slate-600">30% income limit</div>
        <div className="text-slate-900">
          {result.msrLimit !== undefined ? `$${fmtMoney(result.msrLimit)}` : "-"}
        </div>

        {result.affordableMonthly !== undefined && (
          <>
            <div className="text-slate-600">Can afford monthly</div>
            <div>
              {result.affordableMonthly ? (
                <span className="text-green-600">✓ Yes</span>
              ) : (
                <span className="text-red-600">✗ No</span>
              )}
            </div>
          </>
        )}
      </div>

      {result.score !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-600">Affordability score</span>
            <span className="text-slate-900">{result.score}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={result.score}
            readOnly
            className="w-full accent-blue-600"
            aria-label="Affordability score (1 to 10)"
          />
        </div>
      )}

      {result.reasons.length > 0 && (
        <ul className="list-disc pl-5 mt-3 text-xs text-slate-500">
          {result.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
