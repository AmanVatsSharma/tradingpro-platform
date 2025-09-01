/**
 * @file MarketDataProvider.tsx
 * @description Provides a centralized context for fetching and distributing live market data.
 * This component batches all required instrument IDs (from watchlist, positions, indices)
 * into a single API call every 5 seconds, making the app highly efficient.
 */
"use client"

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react"

const LIVE_PRICE_POLL_INTERVAL = 5000 // 5 seconds, as requested

interface Quote {
  last_trade_price: number
  // Add other fields from the API response if needed
}

interface MarketDataContextType {
  quotes: Record<string, Quote>
  isLoading: boolean
}

const MarketDataContext = createContext<MarketDataContextType>({
  quotes: {},
  isLoading: true,
})

export const useMarketData = () => useContext(MarketDataContext)

interface MarketDataProviderProps {
  watchlist: { instrumentId: string }[]
  positions: { instrumentId?: string }[]
  children: ReactNode
}

// Define Nifty and BankNifty instrument IDs here for easy management
const INDEX_INSTRUMENTS = {
  NIFTY: "NSE_EQ-26000",
  BANKNIFTY: "NSE_EQ-26009",
}

export function MarketDataProvider({ watchlist, positions, children }: MarketDataProviderProps) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Memoize the compiled list of unique instrument IDs to prevent unnecessary recalculations
  const instrumentIds = useMemo(() => {
    const ids = new Set<string>()

    // Add indices
    ids.add(INDEX_INSTRUMENTS.NIFTY)
    ids.add(INDEX_INSTRUMENTS.BANKNIFTY)

    // Add watchlist instruments
    watchlist.forEach((item) => item.instrumentId && ids.add(item.instrumentId))
    
    // Add position instruments
    positions.forEach((pos) => pos.instrumentId && ids.add(pos.instrumentId))

    return Array.from(ids)
  }, [watchlist, positions])

  useEffect(() => {
    if (instrumentIds.length === 0) {
      setIsLoading(false)
      return
    }

    const fetchQuotes = async () => {
      try {
        const params = new URLSearchParams()
        instrumentIds.forEach((id) => params.append("q", id))
        const res = await fetch(`/api/quotes?${params.toString()}`)

        if (!res.ok) {
          throw new Error(`Failed to fetch quotes: ${res.statusText}`)
        }

        const data = await res.json()
        if (data.status === "success" && data.data) {
          setQuotes(data.data)
        }
      } catch (error) {
        console.error("MarketDataProvider Error:", error)
      } finally {
        if (isLoading) setIsLoading(false)
      }
    }

    fetchQuotes() // Initial fetch
    const interval = setInterval(fetchQuotes, LIVE_PRICE_POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [instrumentIds, isLoading])

  return (
    <MarketDataContext.Provider value={{ quotes, isLoading }}>
      {children}
    </MarketDataContext.Provider>
  )
}
