"use client"
import { TradingDashboard } from "@/components/trading-dashboard"
import { SessionProvider } from "next-auth/react"

export default function Page() {
  return (
      <TradingDashboard />
  )
}
