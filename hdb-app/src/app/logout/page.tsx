"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Clear client-side stored username
        if (typeof window !== "undefined") localStorage.removeItem("username");

        // Call API to clear server cookie
        await fetch("/api/logout", { method: "POST" });
      } catch (err) {
        // ignore
      } finally {
        // Force a full reload to the root so the app re-reads auth state and shows guest UI
        if (typeof window !== "undefined") {
          window.location.href = "/";
        } else {
          router.replace("/");
        }
      }
    })();
  }, [router]);

  return <div className="min-h-screen flex items-center justify-center">Logging out…</div>;
}
