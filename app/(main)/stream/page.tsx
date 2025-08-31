"use client";

import { useEffect, useState } from "react";

interface StockData {
  id: string;
  price: number;
  time: string;
  changePercent?: number;
}

export default function StreamPage() {
  const [data, setData] = useState<StockData[]>([]);

  useEffect(() => {
    // 👀 Trigger backend route (starts proxy once)
    fetch("/api/stream");

    const ws = new WebSocket("ws://localhost:8081");
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setData((prev) => [msg, ...prev].slice(0, 20));
    };

    return () => ws.close();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📈 Live Stock Prices</h1>
      <ul className="space-y-2">
        {data.map((item, i) => (
          <li key={i} className="border p-2 rounded">
            <strong>{item.id}</strong> → ₹{item?.price.toFixed(2)} (
            {item.changePercent?.toFixed(2)}%) at{" "}
            {new Date(Number(item.time)).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
