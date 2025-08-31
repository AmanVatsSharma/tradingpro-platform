"use client"

import { useState } from "react"
import { Search, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Stock {
  id: string
  instrumentId: string
  exchange: string
  ticker: string
  name: string
  ltp: number
  change: number
  changePercent: number
  sector?: string
}

interface StockSearchProps {
  onAddStock: (stockId: string) => void
  onClose: () => void
}

export function StockSearch({ onAddStock, onClose }: StockSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Stock[]>([])
  const [loading, setLoading] = useState(false)

  const searchStocks = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setResults(data.stocks || [])
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setQuery(value)
    searchStocks(value)
  }

  const handleAddStock = (stockId: string) => {
    onAddStock(stockId)
    setQuery("")
    setResults([])
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Add Stock to Watchlist</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search stocks by name or ticker..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && <div className="text-center py-4 text-gray-500">Searching...</div>}

      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((stock) => (
            <div key={stock.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stock.ticker}</span>
                  <Badge variant="outline" className="text-xs">
                    {stock.exchange}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">{stock.name}</div>
                {stock.sector && <div className="text-xs text-gray-500">{stock.sector}</div>}
              </div>

              <div className="text-right mr-4">
                <div className="font-medium">₹{stock.ltp.toFixed(2)}</div>
                <div className={`text-sm ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {stock.change >= 0 ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>

              <Button size="sm" onClick={() => handleAddStock(stock.id)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="text-center py-4 text-gray-500">No stocks found for "{query}"</div>
      )}
    </Card>
  )
}
