"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  Wallet,
  FileText,
  Eye,
  Bell,
  Settings,
  User,
  Target,
  Activity,
  MoreHorizontal,
  Plus,
  AlertCircle,
  Loader2,
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { usePortfolio, useWatchlist, useOrders, usePositions, placeOrder, searchStocks } from "@/lib/hooks/use-trading-data"
import { OrderManagement } from "@/components/order-management"
import { PositionTracking } from "@/components/position-tracking"
import { useSession } from "next-auth/react"
import { OrderType } from "@prisma/client"

interface WatchlistItem {
  id: string
  instrumentId: string
  symbol: string
  name: string
  ltp: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  close: number
  volume: number
  sector?: string
  exchange: string
  lastUpdated: string
}

interface Stock {
  id: string
  instrumentId: string
  ticker: string
  name: string
  ltp: number
  change: number
  changePercent: number
  sector?: string
  exchange: string
}

const kiteCard = "bg-white border border-gray-200 shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200"
const kiteHeader = "bg-white border-b border-gray-200 shadow-sm"
const kiteBuyButton = "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
const kiteSellButton = "bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200"

export function TradingDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("watchlist")
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [stockSearchOpen, setStockSearchOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<WatchlistItem | null>(null)
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile")

  const [marketIndices, setMarketIndices] = useState<any>({})
  const [indicesLoading, setIndicesLoading] = useState(true)

  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Stock[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const userId = session?.user?.id

  const { portfolio, isLoading: portfolioLoading, isError: portfolioError, error: portfolioErrorDetails, mutate: mutatePortfolio, ensure } = usePortfolio(userId)
  const { watchlist, isLoading: watchlistLoading, isError: watchlistError, error: watchlistErrorDetails, mutate: mutateWatchlist } = useWatchlist()
  const { orders, isLoading: ordersLoading, isError: ordersError, error: ordersErrorDetails, mutate: mutateOrders } = useOrders(userId)
  const { positions, isLoading: positionsLoading, isError: positionsError, error: positionsErrorDetails, mutate: mutatePositions } = usePositions(userId)

  useEffect(() => {
    const handleResize = () => setViewMode(window.innerWidth >= 768 ? "desktop" : "mobile")
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (userId && ensure) {
      ensure().catch(console.error)
    }
  }, [userId, ensure])

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        setIndicesLoading(true);
        // Using NIFTYBEES and BANKNIFTY as examples for indices
        const res = await fetch('/api/quotes?q=NSE_EQ-26000&q=NSE_EQ-26009&mode=ltp');
        const data = await res.json();
        if (data.status === 'success') {
          setMarketIndices(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch indices", error);
      } finally {
        setIndicesLoading(false);
      }
    };

    const interval = setInterval(fetchIndices, 5000);
    fetchIndices();

    return () => clearInterval(interval);
  }, []);

  const handleSearchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
      const results = await searchStocks(query)
      setSearchResults(results as Stock[])
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
      toast({ title: "Search Error", description: "Failed to search stocks. Please try again.", variant: "destructive" })
    } finally {
      setSearchLoading(false)
    }
  }

  const handlePlaceOrder = async (orderData: {
    symbol: string
    name: string
    type: "BUY" | "SELL"
    orderType: OrderType
    lots: number
    price: number
  }) => {
    if (!selectedContract?.id || !userId) {
      toast({ title: "Error", description: "No stock selected or user not logged in.", variant: "destructive" })
      return
    }

    try {
      await placeOrder({
        userId,
        symbol: orderData.symbol,
        stockId: selectedContract.id,
        instrumentId: selectedContract.instrumentId,
        quantity: orderData.lots,
        price: orderData.price,
        orderType: orderData.orderType,
        orderSide: orderData.type,
        productType: "MIS",
      })

      setOrderDialogOpen(false)
      setSelectedContract(null)
      mutateOrders()
      mutatePortfolio()
      toast({ title: "Order Submitted", description: `${orderData.type} order for ${orderData.lots} qty of ${orderData.symbol} is pending.` })
    } catch (error) {
      toast({ title: "Order Failed", description: error instanceof Error ? error.message : "Failed to place order", variant: "destructive" })
    }
  }

  const ErrorState = ({ error, retry, title }: { error: any; retry: () => void; title: string }) => (
    <Card className={kiteCard}>
      <CardContent className="p-8 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-3" />
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Error Loading {title}</h3>
        <p className="text-gray-600 mb-4">{error?.message || "Something went wrong. Please try again."}</p>
        <Button onClick={retry} variant="outline" size="sm">Retry</Button>
      </CardContent>
    </Card>
  )

  const LoadingState = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className={kiteCard}>
          <CardContent className="p-3">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const OrderDialog = () => {
    const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY")
    const [orderProductType, setOrderProductType] = useState<OrderType>('LIMIT');
    const [lots, setLots] = useState(1)
    const [price, setPrice] = useState(selectedContract?.ltp || 0)
    const [placing, setPlacing] = useState(false)

    useEffect(() => {
        if (selectedContract) {
            setPrice(selectedContract.ltp);
        }
    }, [selectedContract]);

    const margin = 15000 * lots 
    const availableBalance = portfolio?.account?.availableMargin || 0

    const handleSubmitOrder = async () => {
      if (!selectedContract) return
      setPlacing(true)
      try {
        await handlePlaceOrder({
          symbol: selectedContract.symbol,
          name: selectedContract.name,
          type: orderSide,
          orderType: orderProductType,
          lots,
          price,
        })
      } finally {
        setPlacing(false)
      }
    }

    return (
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg shadow-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Target className="h-5 w-5 text-blue-600" />Place Order</DialogTitle></DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h3 className="font-semibold text-gray-900">{selectedContract.name}</h3>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div><span className="text-gray-500">LTP</span><p className="font-mono font-semibold text-gray-900">₹{selectedContract.ltp.toFixed(2)}</p></div>
                  <div><span className="text-gray-500">Change</span><p className={`font-mono font-semibold ${selectedContract.change >= 0 ? "text-green-600" : "text-red-600"}`}>{selectedContract.change >= 0 ? "+" : ""}₹{selectedContract.change.toFixed(2)}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={orderSide === "BUY" ? "default" : "outline"} onClick={() => setOrderSide("BUY")} className={`h-10 ${orderSide === "BUY" ? kiteBuyButton : "border-gray-300 text-gray-700 hover:bg-gray-50"}`} disabled={placing}>BUY</Button>
                <Button variant={orderSide === "SELL" ? "destructive" : "outline"} onClick={() => setOrderSide("SELL")} className={`h-10 ${orderSide === "SELL" ? kiteSellButton : "border-gray-300 text-gray-700 hover:bg-gray-50"}`} disabled={placing}>SELL</Button>
              </div>
              <Tabs value={orderProductType} onValueChange={(value) => setOrderProductType(value as OrderType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="LIMIT">Limit</TabsTrigger><TabsTrigger value="MARKET">Market</TabsTrigger></TabsList>
              </Tabs>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Quantity</Label><Input type="number" value={lots} onChange={(e) => setLots(Number(e.target.value))} min="1" className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500" disabled={placing}/></div>
                <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Price</Label><Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} step="0.05" className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500" disabled={placing || orderProductType === 'MARKET'}/></div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Margin Required:</span><span className="font-mono font-semibold text-gray-900">₹{margin.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Available Balance:</span><span className="font-mono font-semibold text-green-600">₹{availableBalance.toLocaleString()}</span></div>
              </div>
              <Button onClick={handleSubmitOrder} className={`w-full h-10 ${orderSide === "BUY" ? kiteBuyButton : kiteSellButton}`} disabled={availableBalance < margin || placing || !lots || (orderProductType === 'LIMIT' && !price)}>
                {placing ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Placing...</div> : `Place ${orderSide} Order`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  const renderWatchlist = () => (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold text-gray-900">Watchlist</h2><p className="text-sm text-gray-600">Live Market Data</p></div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setStockSearchOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"><Plus className="h-3 w-3 mr-1" />Add Stock</Button>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-xs text-green-600 font-medium">LIVE</span></div>
        </div>
      </div>
      {watchlistError && <ErrorState error={watchlistErrorDetails} retry={mutateWatchlist} title="Watchlist" />}
      {watchlistLoading && !watchlistError && <LoadingState count={5} />}
      {!watchlistLoading && !watchlistError && watchlist.length === 0 && (
        <Card className={kiteCard}><CardContent className="p-8 text-center"><Eye className="h-8 w-8 mx-auto text-gray-400 mb-3" /><h3 className="text-lg font-semibold mb-2 text-gray-900">Your watchlist is empty</h3><p className="text-gray-600 mb-4">Add stocks to track their live prices</p><Button onClick={() => setStockSearchOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-2" />Add Stocks</Button></CardContent></Card>
      )}
      {!watchlistLoading && !watchlistError && watchlist.length > 0 && (
        <div className="space-y-1">
          {watchlist.map((contract: WatchlistItem) => (
            <Card key={contract.symbol} className={`${kiteCard} cursor-pointer hover:bg-gray-50`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-900 text-sm">{contract.symbol}</h3><Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">{contract.exchange}</Badge></div>
                    <p className="text-xs text-gray-500 mt-0.5">{contract.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono font-semibold text-gray-900">₹{contract.ltp.toFixed(2)}</div>
                      <div className={`text-xs font-medium ${contract.change >= 0 ? "text-green-600" : "text-red-600"}`}>{contract.change >= 0 ? "+" : ""}₹{contract.change.toFixed(2)} ({contract.changePercent >= 0 ? "+" : ""}{contract.changePercent.toFixed(2)}%)</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" className={`${kiteBuyButton} h-7 px-3 text-xs`} onClick={() => { setSelectedContract(contract); setOrderDialogOpen(true); }}>B</Button>
                      <Button size="sm" className={`${kiteSellButton} h-7 px-3 text-xs`} onClick={() => { setSelectedContract(contract); setOrderDialogOpen(true); }}>S</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderOrders = () => (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-900">Orders</h2><Button size="sm" className={`${kiteBuyButton} h-8 px-3 text-xs`} onClick={() => setStockSearchOpen(true)}><Plus className="h-3 w-3 mr-1" />New Order</Button></div>
      {portfolioError && <ErrorState error={portfolioErrorDetails} retry={mutatePortfolio} title="Portfolio" />}
      {!portfolioLoading && !portfolioError && portfolio && (
        <Card className={kiteCard}><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Available Balance</p><p className="text-2xl font-semibold text-gray-900 font-mono">₹{portfolio.account.availableMargin.toLocaleString()}</p></div><div className="text-right"><p className="text-sm text-gray-600">Used Margin</p><p className="text-xl font-semibold text-orange-600 font-mono">₹{portfolio.account.usedMargin.toLocaleString()}</p></div></div><div className="mt-3 bg-gray-200 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${Math.min((portfolio.account.usedMargin / portfolio.account.totalValue) * 100, 100)}%` }}></div></div></CardContent></Card>
      )}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-md p-1"><TabsTrigger value="all" className="text-sm font-medium">All ({orders.length})</TabsTrigger><TabsTrigger value="pending" className="text-sm font-medium">Pending ({orders.filter((o: any) => o.status === "PENDING").length})</TabsTrigger><TabsTrigger value="executed" className="text-sm font-medium">Executed ({orders.filter((o: any) => o.status === "EXECUTED").length})</TabsTrigger></TabsList>
        <TabsContent value="all" className="space-y-2 mt-4">
            {ordersError && <ErrorState error={ordersErrorDetails} retry={mutateOrders} title="Orders" />}
            {ordersLoading && !ordersError && <LoadingState count={3} />}
            {!ordersLoading && !ordersError && orders.length > 0 && <OrderManagement orders={orders} onOrderUpdate={mutateOrders} />}
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderPositions = () => {
    const totalPnL = positions?.reduce((sum: number, pos: any) => sum + (pos.unrealizedPnL || 0), 0) || 0
    const totalDayPnL = positions?.reduce((sum: number, pos: any) => sum + (pos.dayPnL || 0), 0) || 0

    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-900">Positions</h2><span className="text-sm text-gray-600">{positions?.length || 0} open</span></div>
        <Card className={kiteCard}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600">Total P&L</p><p className={`text-2xl font-semibold font-mono ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>{totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)}</p></div>
              <div className="text-right"><p className="text-sm text-gray-600">Day's P&L</p><p className={`text-xl font-semibold font-mono ${totalDayPnL >= 0 ? "text-green-600" : "text-red-600"}`}>{totalDayPnL >= 0 ? "+" : ""}₹{totalDayPnL.toFixed(2)}</p></div>
            </div>
          </CardContent>
        </Card>
        {positionsError && <ErrorState error={positionsErrorDetails} retry={mutatePositions} title="Positions" />}
        {positionsLoading && !positionsError && <LoadingState count={2} />}
        {!positionsLoading && !positionsError && positions && positions.length > 0 && <PositionTracking positions={positions} onPositionUpdate={mutatePositions} />}
      </div>
    )
  }
  
  const renderContent = () => {
    switch (activeTab) {
      case "watchlist": return renderWatchlist()
      case "orders": return renderOrders()
      case "positions": return renderPositions()
      default: return renderWatchlist()
    }
  }

  const renderIndex = (key: string, name: string) => {
    const indexData = marketIndices[key];
    if (!indexData) return <div className="text-center"><Loader2 className="h-3 w-3 animate-spin" /></div>;
    return (
        <div className="text-center">
            <span className="text-xs font-semibold text-gray-700">{name}</span>
            <p className="text-sm font-mono font-bold text-gray-900">{indexData.last_trade_price.toFixed(2)}</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`${kiteHeader} sticky top-0 z-40`}>
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white"><TrendingUp className="h-4 w-4" /></div>
            <div><h1 className="text-lg font-semibold text-gray-900">TradingPro</h1></div>
          </div>
          <div className="flex items-center gap-4">
            {renderIndex('NSE_EQ-26000', 'NIFTY')}
            {renderIndex('NSE_EQ-26009', 'BANKNIFTY')}
          </div>
        </div>
      </header>

      <main className="px-4 pt-4">{renderContent()}</main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm">
        <div className="grid grid-cols-4 gap-1 p-2">
          {[{ id: "watchlist", icon: Eye, label: "Watchlist" }, { id: "orders", icon: FileText, label: "Orders" }, { id: "positions", icon: TrendingUp, label: "Positions" }, { id: "account", icon: Wallet, label: "Account" }].map((item) => (
            <Button key={item.id} variant="ghost" className={`flex flex-col items-center gap-1 h-12 text-xs font-medium rounded-md transition-colors duration-200 ${activeTab === item.id ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"}`} onClick={() => setActiveTab(item.id)}><item.icon className="h-4 w-4" /><span>{item.label}</span></Button>
          ))}
        </div>
      </div>
      <OrderDialog />
    </div>
  )
}
