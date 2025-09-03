/**
 * @file TradingDashboard.tsx
 * @description The main component for the trading application.
 * This file is renamed from test.tsx and heavily refactored to use the new, efficient
 * MarketDataProvider, and includes a fully functional "Account" tab.
 */
"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  Wallet,
  FileText,
  Eye,
  Plus,
  AlertCircle,
  Loader2,
  Target,
} from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

import { usePortfolio, useWatchlist, useOrders, usePositions, placeOrder, searchStocks } from "@/lib/hooks/use-trading-data"
import { MarketDataProvider, useMarketData } from "@/lib/hooks/MarketDataProvider"
import { OrderManagement } from "@/components/order-management"
import { PositionTracking } from "@/components/position-tracking"
import { Account } from "@/components/Account"
import { OrderType } from "@prisma/client"

// Base interfaces for data structures
interface WatchlistItem {
  id: string
  instrumentId: string
  symbol: string
  name: string
  ltp: number
  close: number
  exchange: string
}

interface StockSearchResult {
  id: string
  instrumentId: string
  ticker: string
  name: string
  ltp: number
}

// Main component wrapped with the MarketDataProvider
export function TradingDashboard() {
  const { data: session, status } = useSession()
  const userId = session?.user?.id
  const userName = session?.user?.name
  const userEmail = session?.user?.email

  // Fetch initial static data
  const { portfolio, isLoading: portfolioLoading, isError: portfolioError, mutate: mutatePortfolio, ensure } = usePortfolio(userId, userName, userEmail)
  const { watchlist, isLoading: watchlistLoading, isError: watchlistError, mutate: mutateWatchlist } = useWatchlist()
  const { orders, isLoading: ordersLoading, isError: ordersError, mutate: mutateOrders } = useOrders(userId)
  const { positions, isLoading: positionsLoading, isError: positionsError, mutate: mutatePositions } = usePositions(userId)

  // Ensure user and trading account exist on login
  useEffect(() => {
    if (status === "authenticated" && userId && ensure) {
      ensure().catch(console.error)
    }
  }, [status, userId, ensure])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    )
  }

  // Once authenticated, render the main app wrapped in the data provider
  return (
    <MarketDataProvider watchlist={watchlist} positions={positions}>
      <DashboardContent
        session={session}
        portfolio={{ data: portfolio, isLoading: portfolioLoading, isError: portfolioError, mutate: mutatePortfolio }}
        watchlist={{ data: watchlist, isLoading: watchlistLoading, isError: watchlistError, mutate: mutateWatchlist }}
        orders={{ data: orders, isLoading: ordersLoading, isError: ordersError, mutate: mutateOrders }}
        positions={{ data: positions, isLoading: positionsLoading, isError: positionsError, mutate: mutatePositions }}
      />
    </MarketDataProvider>
  )
}

// The core UI component that consumes market data
function DashboardContent({ session, portfolio, watchlist, orders, positions }: any) {
  const [activeTab, setActiveTab] = useState("watchlist")
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<any>(null)

  const { quotes, isLoading: quotesLoading } = useMarketData()

  const handlePlaceOrder = async (orderData: {
    type: "BUY" | "SELL"
    orderType: OrderType
    quantity: number
    price: number
  }) => {
    if (!selectedStock?.id || !session?.user?.id) {
      toast({ title: "Error", description: "No stock selected or user not logged in.", variant: "destructive" })
      return
    }

    try {
      await placeOrder({
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        symbol: selectedStock.symbol || selectedStock.ticker,
        stockId: selectedStock.id,
        instrumentId: selectedStock.instrumentId,
        quantity: orderData.quantity,
        price: orderData.price,
        orderType: orderData.orderType,
        orderSide: orderData.type,
        productType: "MIS",
      })

      setOrderDialogOpen(false)
      setSelectedStock(null)
      orders.mutate()
      portfolio.mutate()
      toast({ title: "Order Submitted", description: `${orderData.type} order for ${orderData.quantity} qty of ${selectedStock.symbol || selectedStock.ticker} is pending.` })
    } catch (error) {
      toast({ title: "Order Failed", description: error instanceof Error ? error.message : "Failed to place order", variant: "destructive" })
    }
  }

  const ErrorState = ({ retry, title }: { retry: () => void; title: string }) => (
    <Card className="bg-white border border-gray-200"><CardContent className="p-8 text-center"><AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-3" /><h3 className="text-lg font-semibold text-gray-900">Error Loading {title}</h3><p className="text-gray-600 mb-4">Something went wrong. Please try again.</p><Button onClick={retry} variant="outline" size="sm">Retry</Button></CardContent></Card>
  )

  const LoadingState = ({ count = 3 }) => (
    <div className="space-y-2">{Array.from({ length: count }).map((_, i) => (<Card key={i} className="bg-white border"><CardContent className="p-3"><div className="animate-pulse space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div></CardContent></Card>))}</div>
  )

  const OrderDialog = () => {
    const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY")
    const [orderProductType, setOrderProductType] = useState<OrderType>('LIMIT')
    const [quantity, setQuantity] = useState(1)
    const [price, setPrice] = useState(selectedStock?.ltp || 0)
    const [isPlacing, setIsPlacing] = useState(false)
    
    const quote = selectedStock?.instrumentId ? quotes[selectedStock.instrumentId] : null;
    const ltp = quote?.last_trade_price || selectedStock?.ltp || 0;

    useEffect(() => {
        if(selectedStock) setPrice(ltp)
    }, [selectedStock, ltp])

    const handleSubmit = async () => {
      setIsPlacing(true)
      await handlePlaceOrder({ type: orderSide, orderType: orderProductType, quantity, price })
      setIsPlacing(false)
    }

    return (
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}><DialogContent className="sm:max-w-md bg-white">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Target className="h-5 w-5 text-blue-600" />Place Order</DialogTitle></DialogHeader>
          {selectedStock && (<div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border"><h3 className="font-semibold">{selectedStock.name}</h3><p className="text-sm text-gray-600">LTP: <span className="font-mono">₹{ltp.toFixed(2)}</span></p></div>
              <div className="grid grid-cols-2 gap-2"><Button variant={orderSide === "BUY" ? "default" : "outline"} onClick={() => setOrderSide("BUY")} className="bg-blue-600 hover:bg-blue-700 text-white">BUY</Button><Button variant={orderSide === "SELL" ? "destructive" : "outline"} onClick={() => setOrderSide("SELL")} className="bg-red-600 hover:bg-red-700 text-white">SELL</Button></div>
              <Tabs value={orderProductType} onValueChange={(v) => setOrderProductType(v as OrderType)} className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="LIMIT">Limit</TabsTrigger><TabsTrigger value="MARKET">Market</TabsTrigger></TabsList></Tabs>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantity</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" /></div>
                <div><Label>Price</Label><Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} step="0.05" disabled={orderProductType === 'MARKET'}/></div>
              </div>
              <Button onClick={handleSubmit} className={`w-full ${orderSide === "BUY" ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`} disabled={isPlacing}>{isPlacing ? <Loader2 className="h-4 w-4 animate-spin"/> : `Place ${orderSide} Order`}</Button>
            </div>
          )}</DialogContent></Dialog>
    )
  }

  const renderWatchlist = () => (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-gray-900">Watchlist</h2><p className="text-sm text-gray-600">Live Market Data</p></div><div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-xs text-green-600 font-medium">LIVE</span></div></div>
      {watchlist.isError && <ErrorState retry={watchlist.mutate} title="Watchlist" />}
      {(watchlist.isLoading || quotesLoading && watchlist.data.length > 0) && <LoadingState count={5} />}
      {!watchlist.isLoading && watchlist.data.length === 0 && (<Card><CardContent className="p-8 text-center"><Eye className="h-8 w-8 mx-auto text-gray-400 mb-3" /><h3 className="text-lg font-semibold">Your watchlist is empty</h3></CardContent></Card>)}
      <div className="space-y-1">{watchlist.data.map((item: WatchlistItem) => {
          const quote = quotes[item.instrumentId]
          const ltp = quote?.last_trade_price || item.ltp
          const change = ltp - item.close
          const changePercent = item.close > 0 ? (change / item.close) * 100 : 0
          return (<Card key={item.id} className="cursor-pointer hover:bg-gray-50"><CardContent className="p-3"><div className="flex items-center justify-between"><div className="flex-1"><h3 className="font-semibold text-sm">{item.symbol}</h3><p className="text-xs text-gray-500">{item.name}</p></div><div className="flex items-center gap-4"><div className="text-right"><div className="font-mono font-semibold">₹{ltp.toFixed(2)}</div><div className={`text-xs ${change >= 0 ? "text-green-600" : "text-red-600"}`}>{change >= 0 ? "+" : ""}₹{change.toFixed(2)} ({changePercent.toFixed(2)}%)</div></div><div className="flex gap-1"><Button size="sm" className="bg-blue-600 text-white h-7 px-3 text-xs" onClick={() => { setSelectedStock(item); setOrderDialogOpen(true); }}>B</Button><Button size="sm" className="bg-red-600 text-white h-7 px-3 text-xs" onClick={() => { setSelectedStock(item); setOrderDialogOpen(true); }}>S</Button></div></div></div></CardContent></Card>)
        })}</div>
    </div>
  )

  const renderOrders = () => (
      <div className="space-y-4 pb-20">
        <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
        {orders.isError && <ErrorState retry={orders.mutate} title="Orders" />}
        {orders.isLoading && <LoadingState />}
        {!orders.isLoading && !orders.isError && (
            <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="all">All ({orders.data.length})</TabsTrigger><TabsTrigger value="pending">Pending ({orders.data.filter((o: any) => o.status === "PENDING").length})</TabsTrigger><TabsTrigger value="executed">Executed ({orders.data.filter((o: any) => o.status === "EXECUTED").length})</TabsTrigger></TabsList>
            <TabsContent value="all" className="mt-4"><OrderManagement orders={orders.data} onOrderUpdate={orders.mutate} /></TabsContent>
            <TabsContent value="pending" className="mt-4"><OrderManagement orders={orders.data.filter((o: any) => o.status === "PENDING")} onOrderUpdate={orders.mutate} /></TabsContent>
            <TabsContent value="executed" className="mt-4"><OrderManagement orders={orders.data.filter((o: any) => o.status === "EXECUTED")} onOrderUpdate={orders.mutate} /></TabsContent>
            </Tabs>
        )}
      </div>
  )

  const renderPositions = () => {
    const totalPnL = positions.data?.reduce((sum: number, pos: any) => {
        const quote = pos.instrumentId ? quotes[pos.instrumentId] : null;
        const ltp = quote?.last_trade_price || pos.averagePrice;
        return sum + (ltp - pos.averagePrice) * pos.quantity;
    }, 0) || 0;

    return (
      <div className="space-y-4 pb-20">
        <h2 className="text-xl font-semibold text-gray-900">Positions</h2>
        <Card><CardContent className="p-4">
            <p className="text-sm text-gray-600">Total P&L</p>
            <p className={`text-2xl font-semibold font-mono ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>{totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)}</p>
        </CardContent></Card>
        {positions.isError && <ErrorState retry={positions.mutate} title="Positions" />}
        {positions.isLoading && <LoadingState count={2} />}
        {!positions.isLoading && !positions.isError && <PositionTracking positions={positions.data} quotes={quotes} onPositionUpdate={positions.mutate} />}
      </div>
    )
  }
  
  const renderAccount = () => (
    <div className="space-y-4 pb-20">
        <h2 className="text-xl font-semibold text-gray-900">Account</h2>
        {portfolio.isLoading && <LoadingState />}
        {portfolio.isError && <ErrorState retry={portfolio.mutate} title="Account Details" />}
        {!portfolio.isLoading && !portfolio.isError && portfolio.data && (
            <Account portfolio={portfolio.data} user={session?.user} />
        )}
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "watchlist": return renderWatchlist()
      case "orders": return renderOrders()
      case "positions": return renderPositions()
      case "account": return renderAccount() // This now works!
      default: return renderWatchlist()
    }
  }

  const renderIndex = (instrumentId: string, name: string) => {
    const quote = quotes[instrumentId]
    if (quotesLoading || !quote) return <div className="text-center w-20"><Loader2 className="h-3 w-3 animate-spin mx-auto" /></div>
    return (
        <div className="text-center w-20">
            <span className="text-xs font-semibold text-gray-700">{name}</span>
            <p className="text-sm font-mono font-bold text-gray-900">{quote.last_trade_price.toFixed(2)}</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b sticky top-0 z-40"><div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white"><TrendingUp className="h-4 w-4" /></div><h1 className="text-lg font-semibold">TradingPro</h1></div>
          <div className="flex items-center gap-4">{renderIndex('NSE_EQ-26000', 'NIFTY')}{renderIndex('NSE_EQ-26009', 'BANKNIFTY')}</div>
        </div></header>

      <main className="px-4 pt-4">{renderContent()}</main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t"><div className="grid grid-cols-4 gap-1 p-2">
          {[{ id: "watchlist", icon: Eye, label: "Watchlist" }, { id: "orders", icon: FileText, label: "Orders" }, { id: "positions", icon: TrendingUp, label: "Positions" }, { id: "account", icon: Wallet, label: "Account" }].map((item) => (<Button key={item.id} variant="ghost" className={`flex flex-col h-12 text-xs rounded-md ${activeTab === item.id ? "text-blue-600 bg-blue-50" : "text-gray-600"}`} onClick={() => setActiveTab(item.id)}><item.icon className="h-4 w-4 mb-1" /><span>{item.label}</span></Button>))}
      </div></div>
      <OrderDialog />
    </div>
  )
}
