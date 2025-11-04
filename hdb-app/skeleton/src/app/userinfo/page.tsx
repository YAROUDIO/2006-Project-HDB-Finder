"use client";
import React, { useEffect, useState } from "react";

export default function UserInfo() {
  const [income, setIncome] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
  const [loanType, setLoanType] = useState("");
  const [flatType, setFlatType] = useState("");
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("");
  const [lease, setLease] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/userinfo");
        if (!res.ok) return;
        const { user } = await res.json();
        if (user) {
          setIncome(user.income ? String(user.income) : "");
          setCitizenship(user.citizenship || "");
          setHouseholdSize(user.householdSize ? String(user.householdSize) : "");
          setLoanType(user.loan || "");
          setFlatType(user.flatType || "");
          setBudget(user.budget ? String(user.budget) : "");
          setArea(user.area || "");
          setLease(user.leaseLeft ? String(user.leaseLeft) : "");
        }
      } catch {}
    })();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk("");
    if (income && !/^[0-9]+$/.test(income)) {
      setError("Income must be an integer");
      return;
    }
    try {
      const res = await fetch("/api/userinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income,
          citizenship,
          householdSize,
          loan: loanType,
          flatType,
          budget,
          area,
          leaseLeft: lease,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || data.message || "Save failed");
      else setOk("Successfully Saved!");
    } catch {
      setError("Save failed");
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 720, margin: "40px auto", display: "grid", gap: 10 }}>
      <h2>User Info (Skeleton)</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {ok && <div style={{ color: "green" }}>{ok}</div>}
      <input value={income} onChange={e => setIncome(e.target.value)} placeholder="Yearly income (int)" />
      <input value={citizenship} onChange={e => setCitizenship(e.target.value)} placeholder="Citizenship" />
      <input value={householdSize} onChange={e => setHouseholdSize(e.target.value)} placeholder="Household Size" />
      <input value={loanType} onChange={e => setLoanType(e.target.value)} placeholder="Loan Type" />
      <input value={flatType} onChange={e => setFlatType(e.target.value)} placeholder="Flat Type" />
      <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Budget" />
      <input value={area} onChange={e => setArea(e.target.value)} placeholder="Area" />
      <input value={lease} onChange={e => setLease(e.target.value)} placeholder="Lease Left" />
      <button type="submit">Save</button>
    </form>
  );
}
