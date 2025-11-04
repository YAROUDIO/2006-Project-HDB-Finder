"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#faf5ef" }}>
      <header style={{ background: "#fad3b1ff", padding: "16px 24px", display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>HDBFinder (Skeleton)</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
          <Link href="/account">Account</Link>
          <Link href="/userinfo">User Info</Link>
          <Link href="/userpref">User Pref</Link>
        </nav>
      </header>

      <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <p>This is a demo skeleton: navigation and forms work, data is mocked server-side.</p>
      </main>
    </div>
  );
}
