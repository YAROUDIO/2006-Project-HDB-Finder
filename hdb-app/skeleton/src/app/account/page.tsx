"use client";
import React, { useEffect, useState } from "react";

type U = {
  username?: string;
  income?: number;
  citizenship?: string;
  householdSize?: number;
  loan?: string;
  flatType?: string;
  budget?: number;
  area?: string;
  leaseLeft?: number;
};

export default function AccountPage() {
  const [user, setUser] = useState<U | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/userinfo");
        const data = await res.json();
        if (res.ok) setUser(data.user);
        else setErr(data.error || data.message || "Failed to load");
      } catch {
        setErr("Failed to load");
      }
    })();
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <h2>Account (Skeleton)</h2>
      {err && <div style={{ color: "red" }}>{err}</div>}
      {!user ? (
        <div>Loading…</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {Object.entries(user).map(([k, v]) => (
              <tr key={k}>
                <td style={{ borderBottom: "1px solid #eee", padding: 8, fontWeight: 600 }}>{k}</td>
                <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{String(v ?? "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
