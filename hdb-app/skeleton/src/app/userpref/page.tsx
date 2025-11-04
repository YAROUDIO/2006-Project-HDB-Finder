"use client";
import React, { useEffect, useState } from "react";

export default function UserPref() {
  const [loan, setLoan] = useState("");
  const [flatType, setFlatType] = useState("");
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("");
  const [leaseLeft, setLeaseLeft] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/userpref");
        if (!res.ok) return;
        const { user } = await res.json();
        setLoan(user.loan || "");
        setFlatType(user.flatType || "");
        setBudget(user.budget ? String(user.budget) : "");
        setArea(user.area || "");
        setLeaseLeft(user.leaseLeft ? String(user.leaseLeft) : "");
      } catch {}
    })();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/userpref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan, flatType, budget, area, leaseLeft }),
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
      <h2>User Preferences (Skeleton)</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {ok && <div style={{ color: "green" }}>{ok}</div>}
      <input value={loan} onChange={e => setLoan(e.target.value)} placeholder="Loan Type" />
      <input value={flatType} onChange={e => setFlatType(e.target.value)} placeholder="Flat Type" />
      <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Budget" />
      <input value={area} onChange={e => setArea(e.target.value)} placeholder="Area" />
      <input value={leaseLeft} onChange={e => setLeaseLeft(e.target.value)} placeholder="Lease Left" />
      <button type="submit">Save</button>
    </form>
  );
}
