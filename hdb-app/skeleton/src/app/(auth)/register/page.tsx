"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Register() {
  const router = useRouter();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [rePassword, setR] = useState("");
  const [error, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, rePassword }),
    });
    if (res.ok) router.push("/login");
    else setErr((await res.json()).error ?? "Register failed");
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "80px auto", display: "grid", gap: 8 }}>
      <h2>Register (Skeleton)</h2>
      <input value={username} onChange={e => setU(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={e => setP(e.target.value)} placeholder="Password" />
      <input type="password" value={rePassword} onChange={e => setR(e.target.value)} placeholder="Confirm password" />
      <button type="submit">Register</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
