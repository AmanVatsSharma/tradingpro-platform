// app/admin/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [dbStatus, setDbStatus] = useState("Checking...");
  const [accessToken, setAccessToken] = useState("");
  const [ltp, setLtp] = useState("");

  // Fetch latest token & db status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/admin/api/db-status");
        const data = await res.json();
        setDbStatus(data.db);
        setAccessToken(data.token || "Not found");
      } catch {
        setDbStatus("❌ Error");
      }
    };
    fetchStatus();
  }, []);

  // Test button click
  const handleTest = async () => {
    const res = await fetch("/admin/api/nifty");
    const data = await res.json();
    if (data.error) setLtp("Error: " + data.error);
    else setLtp(JSON.stringify(data));
  };

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">⚙️ Admin Dashboard</h1>

      <div className="mb-4">
        <p><strong>DB Connection:</strong> {dbStatus}</p>
        <p className="truncate"><strong>Latest Access Token:</strong> {accessToken}</p>
      </div>

      <Button onClick={handleTest} className="mb-4">🔍 Test NIFTY LTP</Button>

      {ltp && (
        <div className="p-4 bg-gray-100 rounded-md shadow">
          <h2 className="font-semibold mb-2">NIFTY LTP Result:</h2>
          <pre className="text-sm">{ltp}</pre>
        </div>
      )}
    </div>
  );
}
