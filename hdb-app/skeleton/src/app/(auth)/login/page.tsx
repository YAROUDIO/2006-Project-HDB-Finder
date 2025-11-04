"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) router.push("/home");
    else setErr((await res.json()).error ?? "Login failed");
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: "80px auto", display: "grid", gap: 8 }}>
      <h2>Login (Skeleton)</h2>
      <input value={username} onChange={e => setU(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={e => setP(e.target.value)} placeholder="Password" />
      <button type="submit">Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
