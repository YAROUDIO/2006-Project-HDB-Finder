"use client";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";


export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, rePassword }),
    });
    const data = await res.json();
    setError(data.message || data.error || "");
  } catch (err) {
    setError("Registration failed. Please try again.");
  }
}

  return (
    <div className="min-h-screen w-full font-sans flex items-center justify-center bg-blue-100">
      <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-8 text-center">Register</h1>
        {error && <p className="mb-4 text-red-500 text-center">{error}</p>}
        <form className="flex flex-col gap-6" onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400 text-black"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400 text-black"
            required
          />
          <input
            type="password"
            placeholder="Re-enter Password"
            value={rePassword}
            onChange={(e) => setRePassword(e.target.value)}
            className="p-3 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400 text-black"
            required
          />
          <button
            type="submit"
            className="bg-blue-900 text-white px-6 py-2 rounded font-bold shadow hover:bg-blue-800 transition"
          >
            Register
          </button>
        </form>
        <p className="mt-6 text-center text-blue-800">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-900 font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}