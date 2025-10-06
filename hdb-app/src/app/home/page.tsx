"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function HomePage() {
	// Replace with actual username from context/auth
	const [username] = useState("Username");
	const [dropdownOpen, setDropdownOpen] = useState(false);
	return (
		<div style={{ minHeight: "100vh", width: "100vw", background: "#fff" }}>
			{/* Top Bar */}
			<div style={{ width: "100%", background: "#fad3b1ff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px" }}>
				<h1 style={{ fontSize: "2.2rem", fontWeight: 700, color: "#3a4a2b", margin: 0, letterSpacing: "2px" }}>HDBFinder</h1>
				<div style={{ position: "relative" }}>
					<button
						style={{ background: "#fff", borderRadius: "16px", padding: "8px 24px", fontWeight: 500, color: "#3a4a2b", border: "1px solid #e0e0e0", cursor: "pointer", boxShadow: "none", minWidth: 120 }}
						onClick={() => setDropdownOpen((open) => !open)}
					>
						{username}
					</button>
					{dropdownOpen && (
						<div style={{ position: "absolute", right: 0, top: "110%", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #e0e0e0", minWidth: "180px", zIndex: 10, padding: "8px 0" }}>
							<div style={{ padding: "12px 24px", fontWeight: 700, color: "#3a4a2b", borderBottom: "1px solid #f0f0f0" }}>{username}</div>
							<div style={{ padding: "12px 24px", color: "#3a4a2b", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}>Account</div>
							<Link href="/userinfo" style={{ display: "block", padding: "12px 24px", color: "#3a4a2b", textDecoration: "none", fontWeight: 500, borderBottom: "1px solid #f0f0f0" }} onClick={() => setDropdownOpen(false)}>User Info</Link>
							<Link href="/" style={{ display: "block", padding: "12px 24px", color: "#3a4a2b", textDecoration: "none", fontWeight: 500 }} onClick={() => setDropdownOpen(false)}>Logout</Link>
						</div>
					)}
				</div>
			</div>

			{/* Search Bar and Filter */}
			<div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 48 }}>
				<div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 600 }}>
					<input
						type="text"
						placeholder="Search for flats..."
						style={{ flex: 1, padding: "14px 20px", fontSize: "1.1rem", borderRadius: "16px 0 0 16px", border: "1px solid #e0e0e0", outline: "none", background: "#fff" }}
					/>
					<button
						style={{ background: "#fad3b1ff", color: "#3a4a2b", border: "none", borderRadius: "0 16px 16px 0", padding: "14px 32px", fontWeight: 600, fontSize: "1.1rem", cursor: "pointer" }}
					>
						Filter
					</button>
				</div>

				{/* Bubble Buttons */}
				<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginTop: 32 }}>
					<button style={{ background: "#fad3b1ff", color: "#3a4a2b", border: "none", borderRadius: "32px", padding: "14px 32px", fontWeight: 600, fontSize: "1.1rem", marginBottom: 16, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>View all Flats</button>
					<button style={{ background: "#fad3b1ff", color: "#3a4a2b", border: "none", borderRadius: "32px", padding: "14px 32px", fontWeight: 600, fontSize: "1.1rem", marginBottom: 16, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>View recommended flats</button>
					<button style={{ background: "#fad3b1ff", color: "#3a4a2b", border: "none", borderRadius: "32px", padding: "14px 32px", fontWeight: 600, fontSize: "1.1rem", marginBottom: 16, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>View Bookmarked Flats</button>
				</div>
			</div>

			{/* Center empty for interactive image */}
			<div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, 0)", width: "600px", height: "400px", background: "none", zIndex: 1 }}>
				{/* Insert interactive image here */}
			</div>
		</div>
	);
}
