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

interface WatchlistItem {
  id: string
  symbol: string
  name: string
  ltp: string
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

  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Stock[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const userId = session?.user?.id

  // Data hooks with error handling
  const {
    portfolio,
    isLoading: portfolioLoading,
    isError: portfolioError,
    error: portfolioErrorDetails,
    mutate: mutatePortfolio,
    ensure
  } = usePortfolio(userId)

  const {
    watchlist,
    isLoading: watchlistLoading,
    isError: watchlistError,
    error: watchlistErrorDetails,
    mutate: mutateWatchlist
  } = useWatchlist()

  const {
    orders,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorDetails,
    mutate: mutateOrders
  } = useOrders(userId)

  const {
    positions,
    isLoading: positionsLoading,
    isError: positionsError,
    error: positionsErrorDetails,
    mutate: mutatePositions
  } = usePositions(userId)

  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth >= 768 ? "desktop" : "mobile")
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    // Bootstrap user and account on first load
    if (userId && ensure) {
      ensure().catch(console.error)
    }
  }, [userId, ensure])

  // Search stocks
  const handleSearchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const results = await searchStocks(query)
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
      toast({
        title: "Search Error",
        description: "Failed to search stocks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const handlePlaceOrder = async (orderData: {
    symbol: string
    name: string
    type: "BUY" | "SELL"
    lots: number
    price: string
  }) => {
    try {
      // Ensure selectedContract and its ID exist
      if (!selectedContract?.id) {
        toast({
          title: "Error",
          description: "No stock selected to place an order.",
          variant: "destructive"
        })
        return
      }

      await placeOrder({
        userId,
        symbol: orderData.symbol,
        stockId: selectedContract.id,
        quantity: orderData.lots,
        price: `${orderData.price}`,
        orderType: "LIMIT" as any,
        orderSide: orderData.type,
        productType: "MIS",
      })

      setOrderDialogOpen(false)
      setSelectedContract(null)

      // Refresh data after placing order
      // mutateOrders()
      // mutatePortfolio()
      // setOrderDialogOpen(false)
      // setSelectedContract(null)

      toast({
        title: "Order Submitted",
        description: `${orderData.type} order for ${orderData.lots} qty of ${orderData.symbol} is pending.`,
      })

    } catch (error) {
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive",
      })
    }
  }

  // Error Component
  const ErrorState = ({ error, retry, title }: { error: any; retry: () => void; title: string }) => (
    <Card className={kiteCard}>
      <CardContent className="p-8 text-center">
        <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-3" />
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Error Loading {title}</h3>
        <p className="text-gray-600 mb-4">
          {error?.message || "Something went wrong. Please try again."}
        </p>
        <Button onClick={retry} variant="outline" size="sm">
          Retry
        </Button>
      </CardContent>
    </Card>
  )

  // Loading Component
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

  // Stock Search Dialog
  const StockSearchDialog = () => (
    <Dialog open={stockSearchOpen} onOpenChange={setStockSearchOpen}>
      <DialogContent className="sm:max-w-lg bg-white border border-gray-200 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Search className="h-5 w-5 text-blue-600" />
            Add Stock to Watchlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search stocks by name or ticker..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearchStocks(e.target.value)
              }}
              className="pl-10"
            />
          </div>

          {searchLoading && (
            <div className="text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((stock) => (
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

                  <Button
                    size="sm"
                    onClick={() => {
                      // Add to watchlist logic would go here
                      toast({
                        title: "Added to Watchlist",
                        description: `${stock.ticker} added to your watchlist`,
                      })
                      setStockSearchOpen(false)
                      setSearchQuery("")
                      setSearchResults([])
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No stocks found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  // Order Dialog
  const OrderDialog = () => {
    const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY")
    const [lots, setLots] = useState(1)
    const [price, setPrice] = useState(selectedContract?.ltp || `0`)
    const [placing, setPlacing] = useState(false)

    const margin = 50000 * lots // Simplified margin calculation
    const availableBalance = portfolio?.account?.availableMargin || 0

    const handleSubmitOrder = async () => {
      if (!selectedContract) return

      setPlacing(true)
      try {
        await handlePlaceOrder({
          symbol: selectedContract.symbol,
          name: selectedContract.name,
          type: orderType,
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
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Target className="h-5 w-5 text-blue-600" />
              Place Order
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h3 className="font-semibold text-gray-900">{selectedContract.name}</h3>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-500">LTP</span>
                    <p className="font-mono font-semibold text-gray-900">₹{selectedContract.ltp}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Change</span>
                    <p
                      className={`font-mono font-semibold ${selectedContract.change >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {selectedContract.change >= 0 ? "+" : ""}₹{selectedContract.change.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={orderType === "BUY" ? "default" : "outline"}
                  onClick={() => setOrderType("BUY")}
                  className={`h-10 ${orderType === "BUY" ? kiteBuyButton : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  disabled={placing}
                >
                  BUY
                </Button>
                <Button
                  variant={orderType === "SELL" ? "destructive" : "outline"}
                  onClick={() => setOrderType("SELL")}
                  className={`h-10 ${orderType === "SELL" ? kiteSellButton : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                  disabled={placing}
                >
                  SELL
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Quantity</Label>
                  <Input
                    type="number"
                    value={lots}
                    onChange={(e) => setLots(Number(e.target.value))}
                    min="1"
                    className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={placing}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Price</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    step="0.05"
                    className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={placing}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Margin Required:</span>
                  <span className="font-mono font-semibold text-gray-900">₹{margin.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available Balance:</span>
                  <span className="font-mono font-semibold text-green-600">₹{availableBalance.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleSubmitOrder}
                className={`w-full h-10 ${orderType === "BUY" ? kiteBuyButton : kiteSellButton}`}
                disabled={availableBalance < margin || placing || !lots || !price}
              >
                {placing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing...
                  </div>
                ) : (
                  `Place ${orderType} Order`
                )}
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
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Watchlist</h2>
          <p className="text-sm text-gray-600">Live Market Data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setStockSearchOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Stock
          </Button>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600 font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {watchlistError && (
        <ErrorState
          error={watchlistErrorDetails}
          retry={mutateWatchlist}
          title="Watchlist"
        />
      )}

      {watchlistLoading && !watchlistError && <LoadingState count={5} />}

      {!watchlistLoading && !watchlistError && watchlist.length === 0 && (
        <Card className={kiteCard}>
          <CardContent className="p-8 text-center">
            <Eye className="h-8 w-8 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Your watchlist is empty</h3>
            <p className="text-gray-600 mb-4">Add stocks to track their live prices</p>
            <Button onClick={() => setStockSearchOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Stocks
            </Button>
          </CardContent>
        </Card>
      )}

      {!watchlistLoading && !watchlistError && watchlist.length > 0 && (
        <div className="space-y-1">
          {watchlist.map((contract: WatchlistItem) => (
            <Card key={contract.symbol} className={`${kiteCard} cursor-pointer hover:bg-gray-50`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{contract.symbol}</h3>
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {contract.exchange}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{contract.name}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono font-semibold text-gray-900">₹{contract.ltp.toFixed(2)}</div>
                      <div
                        className={`text-xs font-medium ${contract.change >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {contract.change >= 0 ? "+" : ""}₹{contract.change.toFixed(2)} (
                        {contract.changePercent >= 0 ? "+" : ""}
                        {contract.changePercent.toFixed(2)}%)
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className={`${kiteBuyButton} h-7 px-3 text-xs`}
                        onClick={() => {
                          setSelectedContract(contract)
                          setOrderDialogOpen(true)
                        }}
                      >
                        B
                      </Button>
                      <Button
                        size="sm"
                        className={`${kiteSellButton} h-7 px-3 text-xs`}
                        onClick={() => {
                          setSelectedContract(contract)
                          setOrderDialogOpen(true)
                        }}
                      >
                        S
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Vol: {contract.volume.toLocaleString()}</span>
                    {contract.sector && <span>Sector: {contract.sector}</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    H: {contract.high} L: {contract.low}
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
        <Button
          size="sm"
          className={`${kiteBuyButton} h-8 px-3 text-xs`}
          onClick={() => setStockSearchOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          New Order
        </Button>
      </div>

      {/* Portfolio Summary */}
      {portfolioError && (
        <ErrorState
          error={portfolioErrorDetails}
          retry={mutatePortfolio}
          title="Portfolio"
        />
      )}

      {!portfolioLoading && !portfolioError && portfolio && (
        <Card className={kiteCard}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-semibold text-gray-900 font-mono">
                  ₹{portfolio.account.availableMargin.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Used Margin</p>
                <p className="text-xl font-semibold text-orange-600 font-mono">
                  ₹{portfolio.account.usedMargin.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((portfolio.account.usedMargin / portfolio.account.totalValue) * 100, 100)}%`
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Section */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-md p-1">
          <TabsTrigger value="all" className="text-sm font-medium">
            All ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-sm font-medium">
            Pending ({orders.filter((o: any) => o.status === "PENDING").length})
          </TabsTrigger>
          <TabsTrigger value="executed" className="text-sm font-medium">
            Executed ({orders.filter((o: any) => o.status === "EXECUTED").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2 mt-4">
          {ordersError && (
            <ErrorState
              error={ordersErrorDetails}
              retry={mutateOrders}
              title="Orders"
            />
          )}

          {ordersLoading && !ordersError && <LoadingState count={3} />}

          {!ordersLoading && !ordersError && orders.length === 0 && (
            <Card className={kiteCard}>
              <CardContent className="p-8 text-center">
                <FileText className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">No orders yet</h3>
                <p className="text-gray-600 mb-4">Your orders will appear here when you place them</p>
                <Button
                  onClick={() => setStockSearchOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Place First Order
                </Button>
              </CardContent>
            </Card>
          )}

          {!ordersLoading && !ordersError && orders.length > 0 && (
            <OrderManagement orders={orders} onOrderUpdate={mutateOrders} />
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-2 mt-4">
          {(() => {
            const pendingOrders = orders.filter((order: any) => order.status === "PENDING")
            return pendingOrders.length === 0 ? (
              <Card className={kiteCard}>
                <CardContent className="p-8 text-center">
                  <FileText className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">No pending orders</h3>
                  <p className="text-gray-600">All your orders have been executed or cancelled</p>
                </CardContent>
              </Card>
            ) : (
              <OrderManagement orders={pendingOrders} onOrderUpdate={mutateOrders} />
            )
          })()}
        </TabsContent>

        <TabsContent value="executed" className="space-y-2 mt-4">
          {(() => {
            const executedOrders = orders.filter((order: any) => order.status === "EXECUTED")
            return executedOrders.length === 0 ? (
              <Card className={kiteCard}>
                <CardContent className="p-8 text-center">
                  <FileText className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">No executed orders</h3>
                  <p className="text-gray-600">Your executed orders will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <OrderManagement orders={executedOrders} onOrderUpdate={mutateOrders} />
            )
          })()}
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderPositions = () => {
    const totalPnL = positions?.reduce((sum: number, pos: any) => sum + (pos.unrealizedPnL || 0), 0) || 0
    const totalDayPnL = positions?.reduce((sum: number, pos: any) => sum + (pos.dayPnL || 0), 0) || 0

    return (
      <div className="space-y-4 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Positions</h2>
          <span className="text-sm text-gray-600">{positions?.length || 0} open</span>
        </div>

        {/* P&L Summary */}
        <Card className={kiteCard}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total P&L</p>
                <p className={`text-2xl font-semibold font-mono ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Day's P&L</p>
                <p className={`text-xl font-semibold font-mono ${totalDayPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalDayPnL >= 0 ? "+" : ""}₹{totalDayPnL.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {positionsError && (
          <ErrorState
            error={positionsErrorDetails}
            retry={mutatePositions}
            title="Positions"
          />
        )}

        {positionsLoading && !positionsError && <LoadingState count={2} />}

        {!positionsLoading && !positionsError && (!positions || positions.length === 0) && (
          <Card className={kiteCard}>
            <CardContent className="p-8 text-center">
              <Activity className="h-8 w-8 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No open positions</h3>
              <p className="text-gray-600 mb-4">Your active positions will appear here</p>
              <Button
                onClick={() => setStockSearchOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Start Trading
              </Button>
            </CardContent>
          </Card>
        )}

        {!positionsLoading && !positionsError && positions && positions.length > 0 && (
          <PositionTracking positions={positions} onPositionUpdate={mutatePositions} />
        )}
      </div>
    )
  }

  const renderAccount = () => (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Account</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-gray-200 rounded-md shadow-lg">
            <DropdownMenuItem className="text-sm">
              <User className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm">
              <Settings className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {portfolioError && (
        <ErrorState
          error={portfolioErrorDetails}
          retry={mutatePortfolio}
          title="Account"
        />
      )}

      {portfolioLoading && !portfolioError && <LoadingState count={1} />}

      {!portfolioLoading && !portfolioError && !portfolio && (
        <Card className={kiteCard}>
          <CardContent className="p-8 text-center">
            <Wallet className="h-8 w-8 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Account Not Found</h3>
            <p className="text-gray-600 mb-4">Unable to load your trading account</p>
            <Button onClick={() => ensure?.()}>
              Initialize Account
            </Button>
          </CardContent>
        </Card>
      )}

      {!portfolioLoading && !portfolioError && portfolio && (
        <>
          <Card className={kiteCard}>
            <CardContent className="p-4">
              {session?.user?.name && (
                <p className="text-sm text-gray-600 mb-3">Hello, {session.user.name}!</p>
              )}
              {/* <h3 className="text-lg font-semibold text-gray-900">Account ID: {portfolio.account.accountId}</h3> */}
              {/* <p className="text-sm text-gray-500 mt-1">Broker: {portfolio.account}</p> */}
            </CardContent>
          </Card>
          <Card className={kiteCard}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-3xl font-semibold text-gray-900 font-mono">
                    ₹{portfolio.account.totalValue.toLocaleString()}
                  </p>
                  <p className={`text-sm mt-1 ${portfolio.account.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {portfolio.account.totalPnL >= 0 ? "+" : ""}₹{portfolio.account.totalPnL.toFixed(2)} today
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className={kiteCard}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-xl font-semibold text-green-600 font-mono">
                  ₹{portfolio.account.availableMargin.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className={kiteCard}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Used Margin</p>
                <p className="text-xl font-semibold text-orange-600 font-mono">
                  ₹{portfolio.account.usedMargin.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className={kiteCard}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-gray-900">{orders?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </CardContent>
            </Card>
            <Card className={kiteCard}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-semibold text-green-600">
                  {orders?.length
                    ? Math.round((orders.filter((o: any) => o.status === "EXECUTED").length / orders.length) * 100)
                    : 0}
                  %
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "watchlist":
        return renderWatchlist()
      case "orders":
        return renderOrders()
      case "positions":
        return renderPositions()
      case "account":
        return renderAccount()
      default:
        return renderWatchlist()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`${kiteHeader} sticky top-0 z-40`}>
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">TradingPro</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600 font-medium">Live</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-4">{renderContent()}</main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm">
        <div className="grid grid-cols-4 gap-1 p-2">
          {[
            { id: "watchlist", icon: Eye, label: "Watchlist" },
            { id: "orders", icon: FileText, label: "Orders" },
            { id: "positions", icon: TrendingUp, label: "Positions" },
            { id: "account", icon: Wallet, label: "Account" },
          ].map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-12 text-xs font-medium rounded-md transition-colors duration-200 ${activeTab === item.id
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <OrderDialog />
    </div>
  )
}
