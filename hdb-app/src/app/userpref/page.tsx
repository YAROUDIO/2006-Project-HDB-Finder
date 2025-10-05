"use client";
import React, { useState } from "react";
export default function UserPref() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navOptions = [
    { label: "UserInfo", href: "/userinfo" },
    { label: "UserPreference", href: "/userpreference" },
    { label: "Recommended", href: "/recommended" },
    { label: "HDB Listings", href: "/hdb-listings" },
    { label: "Overview", href: "/overview" },
    { label: "PriceTrend", href: "/pricetrend" },
    { label: "Affordability", href: "/affordability" },
    { label: "Amenities", href: "/amenities" },
  ];

  // Dropdown states
  const [income, setIncome] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
  const [loanType, setLoanType] = useState("");
  const [flatType, setFlatType] = useState("");
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("");
  const [lease, setLease] = useState("");

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: "#fad3b1ff" }}>
      {/* Top white container for navbar and title */}
      <div style={{
        width: "100%",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        borderBottom: "1px solid #e0e0e0"
      }}>
        <nav style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          position: "relative",
          background: "#fff"
        }}>
          {/* Home Button */}
          <a href="/" style={{
            background: "#fad3b1ff",
            borderRadius: "16px",
            padding: "8px 24px",
            fontWeight: 500,
            color: "#3a4a2b",
            textDecoration: "none",
            boxShadow: "none",
            border: "1px solid #e0e0e0"
          }}>Home</a>

          {/* Title */}
          <h1 style={{
            flex: 1,
            textAlign: "center",
            fontSize: "2rem",
            color: "#3a4a2b",
            fontWeight: 600,
            margin: 0,
            letterSpacing: "1px"
          }}>User Preferences</h1>

          {/* Dropdown Menu */}
          <div style={{ position: "relative" }}>
            <button
              style={{
                background: "#fad3b1ff",
                borderRadius: "16px",
                padding: "8px 24px",
                fontWeight: 500,
                color: "#3a4a2b",
                border: "1px solid #e0e0e0",
                cursor: "pointer",
                boxShadow: "none"
              }}
              onClick={() => setDropdownOpen((open) => !open)}
            >
              Navigation ▼
            </button>
            {dropdownOpen && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "110%",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                border: "1px solid #e0e0e0",
                minWidth: "180px",
                zIndex: 10
              }}>
                {navOptions.map((opt) => (
                  <a
                    key={opt.label}
                    href={opt.href}
                    style={{
                      display: "block",
                      padding: "12px 24px",
                      color: "#3a4a2b",
                      textDecoration: "none",
                      fontWeight: 500,
                      borderBottom: "1px solid #f0f0f0"
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    {opt.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Four dropdowns in quadrants */}
      <form
        onSubmit={e => {
          e.preventDefault();
          // TODO: send data to backend
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr auto",
          gap: "64px 64px",
          maxWidth: "900px",
          margin: "64px auto 0 auto",
          minHeight: "400px"
        }}
      >
        {/* Top Left: Yearly household income */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <label style={{ fontWeight: 600, marginBottom: 12, fontSize: "1.1rem", color: "#3a4a2b" }}>Yearly Household Income</label>
          <select value={income} onChange={e => setIncome(e.target.value)} style={{ width: "260px", padding: "10px", fontSize: "1rem", borderRadius: 8, border: "1px solid #ccc", background: "#fff", color: "#000" }}>
            <option value="">Select...</option>
            <option value="$0-$30000">$0-$30000</option>
            <option value="$30000-$50000">$30000-$50000</option>
            <option value="$50000-$75000">$50000-$75000</option>
            <option value="$75000-$100000">$75000-$100000</option>
            <option value=">$100000">More than $100000</option>
          </select>
        </div>

        {/* Top Right: Citizenship */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <label style={{ fontWeight: 600, marginBottom: 12, fontSize: "1.1rem", color: "#3a4a2b" }}>Citizenship</label>
          <select value={citizenship} onChange={e => setCitizenship(e.target.value)} style={{ width: "260px", padding: "10px", fontSize: "1rem", borderRadius: 8, border: "1px solid #ccc", background: "#fff", color: "#000" }}>
            <option value="">Select...</option>
            <option value="Singapore">Singapore</option>
            <option value="Permanent Resident">Permanent Resident</option>
            <option value="Foreigner">Foreigner</option>
          </select>
        </div>

        {/* Bottom Left: Household Size */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <label style={{ fontWeight: 600, marginBottom: 12, fontSize: "1.1rem", color: "#3a4a2b" }}>Household Size</label>
          <select value={householdSize} onChange={e => setHouseholdSize(e.target.value)} style={{ width: "260px", padding: "10px", fontSize: "1rem", borderRadius: 8, border: "1px solid #ccc", background: "#fff", color: "#000" }}>
            <option value="">Select...</option>
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
            <option value=">9">More than 9</option>
          </select>
        </div>

        {/* Bottom Right: Loan Type */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <label style={{ fontWeight: 600, marginBottom: 12, fontSize: "1.1rem", color: "#3a4a2b" }}>Loan Type</label>
          <select value={loanType} onChange={e => setLoanType(e.target.value)} style={{ width: "260px", padding: "10px", fontSize: "1rem", borderRadius: 8, border: "1px solid #ccc", background: "#fff", color: "#000" }}>
            <option value="">Select...</option>
            <option value="Loan A">Loan A</option>
            <option value="Loan B">Loan B</option>
            <option value="Loan C">Loan C</option>
          </select>
        </div>

        {/* Submit Button: bottom middle, spans both columns */}
        <div style={{ gridColumn: "1 / span 2", textAlign: "center", marginTop: "32px" }}>
          <button
            type="submit"
            style={{
              background: "#fff",
              color: "#3a4a2b",
              border: "1px solid #e0e0e0",
              borderRadius: "16px",
              padding: "14px 48px",
              fontSize: "1.2rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "background 0.2s"
            }}
          >
            Submit
          </button>
        </div>
  </form>
    </div>
  );
}