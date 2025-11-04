import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = { title: "HDB Skeleton" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>{children}</body>
    </html>
  );
}
