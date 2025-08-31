// app/components/order-management.tsx
// This component provides a user interface for managing stock orders, including viewing, modifying, cancelling, and deleting orders.
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cancelOrder, modifyOrder, deleteOrder } from "@/lib/hooks/use-trading-data"

interface Order {
  id: string
  symbol: string
  quantity: number
  price: number | null
  orderType: string
  orderSide: string
  status: string
  createdAt: string
  filledQuantity?: number
  averagePrice?: number
}

interface OrderManagementProps {
  orders: Order[]
  onOrderUpdate: () => void
}

export function OrderManagement({ orders, onOrderUpdate }: OrderManagementProps) {
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [modifyPrice, setModifyPrice] = useState(0)
  const [modifyQuantity, setModifyQuantity] = useState(0)
  const [loading, setLoading] = useState<string | null>(null)

  const handleCancelOrder = async (orderId: string) => {
    try {
      setLoading(orderId)
      await cancelOrder(orderId)
      onOrderUpdate()
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully",
      })
    } catch (error) {
      toast({
        title: "Cancel Failed",
        description: error instanceof Error ? error.message : "Failed to cancel order",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleModifyOrder = async () => {
    if (!selectedOrder) return

    try {
      setLoading(selectedOrder.id)
      await modifyOrder(selectedOrder.id, {
        price: modifyPrice,
        quantity: modifyQuantity,
      })
      onOrderUpdate()
      setModifyDialogOpen(false)
      toast({
        title: "Order Modified",
        description: "Your order has been modified successfully",
      })
    } catch (error) {
      toast({
        title: "Modify Failed",
        description: error instanceof Error ? error.message : "Failed to modify order",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    try {
      setLoading(orderId)
      await deleteOrder(orderId)
      onOrderUpdate()
      toast({
        title: "Order Deleted",
        description: "Your order has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete order",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const openModifyDialog = (order: Order) => {
    setSelectedOrder(order)
    setModifyPrice(order.price || 0)
    setModifyQuantity(order.quantity)
    setModifyDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "EXECUTED":
        return "bg-green-50 text-green-700 border-green-200"
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200"
      case "PARTIALLY_FILLED":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  return (
    <>
      <div className="space-y-2">
        {orders.map((order) => (
          <Card
            key={order.id}
            className="bg-white border border-gray-200 shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{order.symbol}</h3>
                    <Badge
                      variant={order.orderSide === "BUY" ? "default" : "destructive"}
                      className={`text-xs px-2 py-0.5 ${order.orderSide === "BUY" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}
                    >
                      {order.orderSide}
                    </Badge>
                    <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>{order.quantity} qty</span>
                    <span>₹{order.price || "Market"}</span>
                    <span>{order.orderType}</span>
                    <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {order.filledQuantity && order.filledQuantity > 0 && (
                    <div className="flex gap-4 mt-1 text-xs text-green-600">
                      <span>Filled: {order.filledQuantity} qty</span>
                      {order.averagePrice && <span>Avg: ₹{order.averagePrice}</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {order.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={loading === order.id}
                        className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {loading === order.id ? "..." : "Cancel"}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white border border-gray-200 rounded-md shadow-lg"
                        >
                          <DropdownMenuItem onClick={() => openModifyDialog(order)} className="text-sm">
                            <Edit className="h-3 w-3 mr-2" />
                            Modify
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-sm text-red-600"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                  {(order.status === "EXECUTED" || order.status === "CANCELLED") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteOrder(order.id)}
                      disabled={loading === order.id}
                      className="h-7 px-2 text-xs text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-gray-200 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Edit className="h-5 w-5 text-blue-600" />
              Modify Order
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <h3 className="font-semibold text-gray-900">{selectedOrder.symbol}</h3>
                <div className="flex gap-4 mt-1 text-sm text-gray-600">
                  <span>{selectedOrder.orderSide}</span>
                  <span>{selectedOrder.orderType}</span>
                  <span>
                    Current: {selectedOrder.quantity} qty @ ₹{selectedOrder.price}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Quantity</Label>
                  <Input
                    type="number"
                    value={modifyQuantity}
                    onChange={(e) => setModifyQuantity(Number(e.target.value))}
                    min="1"
                    className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Price</Label>
                  <Input
                    type="number"
                    value={modifyPrice}
                    onChange={(e) => setModifyPrice(Number(e.target.value))}
                    step="0.05"
                    className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleModifyOrder}
                  disabled={loading === selectedOrder.id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading === selectedOrder.id ? "Modifying..." : "Modify Order"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setModifyDialogOpen(false)}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
