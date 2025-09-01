// "use client"
// import { useQuery } from "@apollo/client/react"
// import { gql } from "@apollo/client/core"
// import client from "@/lib/graphql/apollo-client"
// import { OrderSide, OrderType } from "@/prisma/generated/client"
// import { ToEnum } from "zod/v4/core/util.cjs"

// // Poll intervals (ms)
// const WATCHLIST_POLL = 10000
// const ORDERS_POLL = 30000
// const PORTFOLIO_POLL = 60000
// const POSITIONS_POLL = 5000

// // -----------------------------
// // GraphQL Documents (Fixed for Supabase Auto-gen)
// // -----------------------------

// // Users - using correct table name from schema
// const GET_USER = gql`
//   query GetUser($id: UUID!) {
//     usersCollection(filter: { id: { eq: $id } }) {
//       edges {
//         node {
//           id
//           email
//           name
//           role
//           isActive
//           createdAt
//         }
//       }
//     }
//   }
// `

// const INSERT_USER = gql`
//   mutation InsertUser($objects: [usersInsertInput!]!) {
//     insertIntousersCollection(objects: $objects) {
//       records {
//         id
//         email
//         name
//         role
//       }
//     }
//   }
// `

// // Trading Account - using correct mapped table name
// const GET_ACCOUNT_BY_USER = gql`
//   query GetAccountByUser($userId: UUID!) {
//     trading_accountsCollection(filter: { userId: { eq: $userId } }) {
//       edges {
//         node {
//           id
//           userId
//           balance
//           availableMargin
//           usedMargin
//           createdAt
//           updatedAt
//         }
//       }
//     }
//   }
// `

// const INSERT_ACCOUNT = gql`
//   mutation InsertAccount($objects: [trading_accountsInsertInput!]!) {
//     insertIntotrading_accountsCollection(objects: $objects) {
//       records {
//         id
//         userId
//         balance
//         availableMargin
//         usedMargin
//       }
//     }
//   }
// `

// // Positions - using correct mapped table name
// const GET_POSITIONS = gql`
//   query GetPositions($tradingAccountId: UUID!) {
//     positionsCollection(
//       filter: { tradingAccountId: { eq: $tradingAccountId } }
//       orderBy: [{ createdAt: DescNullsLast }]
//     ) {
//       edges {
//         node {
//           id
//           tradingAccountId
//           symbol
//           quantity
//           averagePrice
//           unrealizedPnL
//           dayPnL
//           stopLoss
//           target
//           createdAt
//           stock {
//             id
//             ticker
//             name
//             ltp
//             change
//             changePercent
//           }
//         }
//       }
//     }
//   }
// `

// const UPDATE_POSITION = gql`
//   mutation UpdatePosition($id: UUID!, $set: positionsUpdateInput!) {
//     updatepositionsCollection(set: $set, filter: { id: { eq: $id } }) {
//       affectedCount
//       records {
//         id
//         stopLoss
//         target
//       }
//     }
//   }
// `

// const DELETE_POSITION = gql`
//   mutation DeletePosition($id: UUID!) {
//     deleteFrompositionsCollection(filter: { id: { eq: $id } }) {
//       affectedCount
//     }
//   }
// `

// // Query to find an existing position for a given symbol and account
// const GET_POSITION_BY_SYMBOL = gql`
//   query GetPositionBySymbol($tradingAccountId: UUID!, $symbol: String!) {
//     positionsCollection(
//       filter: {
//         tradingAccountId: { eq: $tradingAccountId }
//         symbol: { eq: $symbol }
//       }
//     ) {
//       edges {
//         node {
//           id
//           quantity
//           averagePrice
//         }
//       }
//     }
//   }
// `

// // Mutation to insert a new position
// const INSERT_POSITION = gql`
//   mutation InsertPosition($objects: [positionsInsertInput!]!) {
//     insertIntopositionsCollection(objects: $objects) {
//       records {
//         id
//         symbol
//         quantity
//       }
//     }
//   }
// `

// // Orders - using correct mapped table name
// const GET_ORDERS = gql`
//   query GetOrders($tradingAccountId: UUID!) {
//     ordersCollection(
//       filter: { tradingAccountId: { eq: $tradingAccountId } }
//       orderBy: [{ createdAt: DescNullsLast }]
//     ) {
//       edges {
//         node {
//           id
//           tradingAccountId
//           symbol
//           quantity
//           orderType
//           orderSide
//           price
//           filledQuantity
//           averagePrice
//           productType
//           status
//           createdAt
//           executedAt
//           stock {
//             id
//             ticker
//             name
//             ltp
//           }
//         }
//       }
//     }
//   }
// `

// const INSERT_ORDER = gql`
//   mutation InsertOrder($objects: [ordersInsertInput!]!) {
//     insertIntoordersCollection(objects: $objects) {
//       records {
//         id
//         symbol
//         quantity
//         orderType
//         orderSide
//         status
//       }
//     }
//   }
// `

// const UPDATE_ORDER = gql`
//   mutation UpdateOrder($id: UUID!, $set: ordersUpdateInput!) {
//     updateordersCollection(set: $set, filter: { id: { eq: $id } }) {
//       affectedCount
//       records {
//         id
//         status
//       }
//     }
//   }
// `

// const DELETE_ORDER = gql`
//   mutation DeleteOrder($id: UUID!) {
//     deleteFromordersCollection(filter: { id: { eq: $id } }) {
//       affectedCount
//     }
//   }
// `

// // Stocks - for watchlist data
// const GET_STOCKS_FOR_WATCHLIST = gql`
//   query GetStocks($limit: Int = 200) {
//     stockCollection(
//       filter: { isActive: { eq: true } }
//       orderBy: [{ changePercent: DescNullsLast }]
//       first: $limit
//     ) {
//       edges {
//         node {
//           id
//           instrumentId
//           exchange
//           ticker
//           name
//           ltp
//           open
//           high
//           low
//           close
//           volume
//           change
//           changePercent
//           sector
//           isActive
//           updatedAt
//         }
//       }
//     }
//   }
// `

// // Search stocks
// const SEARCH_STOCKS = gql`
//   query SearchStocks($query: String!) {
//     stocksCollection(
//       filter: {
//         and: [
//           { isActive: { eq: true } }
//           {
//             or: [
//               { name: { ilike: $query } }
//               { ticker: { ilike: $query } }
//             ]
//           }
//         ]
//       }
//       first: 10
//     ) {
//       edges {
//         node {
//           id
//           ticker
//           name
//           ltp
//           change
//           changePercent
//           sector
//           exchange
//         }
//       }
//     }
//   }
// `

// // -----------------------------
// // Helper functions
// // -----------------------------

// // Convert Supabase GraphQL decimal/numeric values safely
// const toNumber = (v: any): number => {
//   if (v == null) return 0
//   if (typeof v === "number") return v
//   if (typeof v === "string") {
//     const parsed = parseFloat(v)
//     return isNaN(parsed) ? 0 : parsed
//   }
//   return 0
// }

// // Generate UUID for new records (you might want to use a proper UUID library)
// const generateUUID = () => {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//     const r = Math.random() * 16 | 0
//     const v = c == 'x' ? r : (r & 0x3 | 0x8)
//     return v.toString(16)
//   })
// }

// async function ensureUserAndAccount(
//   apolloClient: any,
//   userId: string,
//   defaultFunding = 250000,
// ): Promise<{ tradingAccountId: string }> {
//   try {
//     // Check if user exists
//     const userRes = await apolloClient.query({
//       query: GET_USER,
//       variables: { id: userId },
//       fetchPolicy: "network-only",
//       errorPolicy: "all"
//     })

//     const userExists = (userRes.data?.usersCollection?.edges?.length ?? 0) > 0

//     if (!userExists) {
//       try {
//         await apolloClient.mutate({
//           mutation: INSERT_USER,
//           variables: {
//             objects: [{
//               id: userId,
//               isActive: true,
//               role: "USER",
//               createdAt: new Date().toISOString(),
//               updatedAt: new Date().toISOString()
//             }],
//           },
//         })
//       } catch (insertError) {
//         console.error("Error inserting user:", insertError)
//         // User might already exist from a race condition, continue
//       }
//     }

//     // Check if trading account exists
//     const acctRes = await apolloClient.query({
//       query: GET_ACCOUNT_BY_USER,
//       variables: { userId },
//       fetchPolicy: "network-only",
//       errorPolicy: "all"
//     })

//     const acctNode = acctRes.data?.trading_accountsCollection?.edges?.[0]?.node
//     if (acctNode?.id) {
//       return { tradingAccountId: acctNode.id }
//     }

//     // Create trading account
//     const accountId = generateUUID()
//     await apolloClient.mutate({
//       mutation: INSERT_ACCOUNT,
//       variables: {
//         objects: [
//           {
//             id: accountId,
//             userId,
//             balance: defaultFunding,
//             availableMargin: defaultFunding,
//             usedMargin: 0,
//             createdAt: new Date().toISOString(),
//             updatedAt: new Date().toISOString()
//           },
//         ],
//       },
//     })

//     return { tradingAccountId: accountId }
//   } catch (error) {
//     console.error("Error in ensureUserAndAccount:", error)
//     throw new Error("Failed to initialize user account")
//   }
// }

// // -----------------------------
// // Hooks
// // -----------------------------

// export function usePortfolio(userId?: string) {
//   const {
//     data: acctData,
//     refetch: refetchAcct,
//     loading: loadingAcct,
//     error: errorAcct
//   } = useQuery(GET_ACCOUNT_BY_USER, {
//     variables: { userId: userId ?? "" },
//     pollInterval: PORTFOLIO_POLL,
//     skip: !userId,
//     errorPolicy: "all",
//     notifyOnNetworkStatusChange: true
//   })

//   async function ensure() {
//     if (!userId) return null
//     try {
//       const acctNode = acctData?.trading_accountsCollection?.edges?.[0]?.node
//       if (acctNode?.id) return acctNode

//       await ensureUserAndAccount(client, userId)
//       await refetchAcct()
//       return null
//     } catch (error) {
//       console.error("Error ensuring user account:", error)
//       return null
//     }
//   }

//   const account = acctData?.trading_accountsCollection?.edges?.[0]?.node
//   const balance = toNumber(account?.balance)
//   const usedMargin = toNumber(account?.usedMargin)
//   const availableMargin = toNumber(account?.availableMargin)
//   const totalValue = balance || (availableMargin + usedMargin)

//   return {
//     portfolio: account ? {
//       account: {
//         totalValue,
//         totalPnL: 0, // Calculate from positions if needed
//         availableMargin,
//         usedMargin,
//         balance
//       },
//     } : null,
//     isLoading: loadingAcct,
//     isError: !!errorAcct,
//     error: errorAcct,
//     mutate: async () => {
//       await refetchAcct()
//     },
//     ensure,
//   }
// }

// export function useWatchlist() {
//   const { data, loading, error, refetch } = useQuery(GET_STOCKS_FOR_WATCHLIST, {
//     pollInterval: WATCHLIST_POLL,
//     errorPolicy: "all",
//     notifyOnNetworkStatusChange: true
//   })

//   const watchlist =
//     data?.stockCollection?.edges?.map((e: any) => ({
//       id: e.node.id,
//       symbol: e.node.ticker,
//       name: e.node.name,
//       ltp: toNumber(e.node.ltp),
//       change: toNumber(e.node.change),
//       changePercent: toNumber(e.node.changePercent),
//       high: toNumber(e.node.high),
//       low: toNumber(e.node.low),
//       open: toNumber(e.node.open),
//       close: toNumber(e.node.close),
//       volume: toNumber(e.node.volume),
//       sector: e.node.sector,
//       exchange: e.node.exchange,
//       lastUpdated: e.node.updatedAt
//     })) ?? []

//   return {
//     watchlist,
//     isLoading: loading,
//     isError: !!error,
//     error,
//     mutate: refetch,
//   }
// }

// function useAccountId(userId?: string) {
//   const { data, error } = useQuery(GET_ACCOUNT_BY_USER, {
//     variables: { userId: userId ?? "" },
//     skip: !userId,
//     pollInterval: PORTFOLIO_POLL,
//     errorPolicy: "all"
//   })

//   if (error) {
//     console.error("Error fetching account:", error)
//   }

//   const id = data?.trading_accountsCollection?.edges?.[0]?.node?.id
//   return id as string | undefined
// }

// export function useOrders(userId?: string) {
//   const tradingAccountId = useAccountId(userId)
//   const { data, loading, error, refetch } = useQuery(GET_ORDERS, {
//     variables: { tradingAccountId: tradingAccountId ?? "" },
//     skip: !tradingAccountId,
//     pollInterval: ORDERS_POLL,
//     errorPolicy: "all",
//     notifyOnNetworkStatusChange: true
//   })

//   const orders =
//     data?.ordersCollection?.edges?.map((e: any) => ({
//       ...e.node,
//       price: e.node.price != null ? toNumber(e.node.price) : null,
//       averagePrice: e.node.averagePrice != null ? toNumber(e.node.averagePrice) : null,
//       stockName: e.node.Stock?.name || e.node.symbol,
//       currentPrice: e.node.Stock ? toNumber(e.node.Stock.ltp) : null
//     })) ?? []

//   return {
//     orders,
//     isLoading: loading || !tradingAccountId,
//     isError: !!error,
//     error,
//     mutate: refetch,
//   }
// }

// export function usePositions(userId?: string) {
//   const tradingAccountId = useAccountId(userId)
//   const { data, loading, error, refetch } = useQuery(GET_POSITIONS, {
//     variables: { tradingAccountId: tradingAccountId ?? "" },
//     skip: !tradingAccountId,
//     pollInterval: POSITIONS_POLL,
//     errorPolicy: "all",
//     notifyOnNetworkStatusChange: true
//   })

//   const positions =
//     data?.positionsCollection?.edges?.map((e: any) => ({
//       ...e.node,
//       averagePrice: toNumber(e.node.averagePrice),
//       unrealizedPnL: toNumber(e.node.unrealizedPnL),
//       dayPnL: toNumber(e.node.dayPnL),
//       stopLoss: e.node.stopLoss != null ? toNumber(e.node.stopLoss) : undefined,
//       target: e.node.target != null ? toNumber(e.node.target) : undefined,
//       currentPrice: e.node.Stock ? toNumber(e.node.Stock.ltp) : toNumber(e.node.averagePrice),
//       stockName: e.node.Stock?.name || e.node.symbol,
//       change: e.node.Stock ? toNumber(e.node.Stock.change) : 0,
//       changePercent: e.node.Stock ? toNumber(e.node.Stock.changePercent) : 0
//     })) ?? []

//   return {
//     positions,
//     isLoading: loading || !tradingAccountId,
//     isError: !!error,
//     error,
//     mutate: refetch,
//   }
// }

// // Search stocks function
// export async function searchStocks(query: string) {
//   try {
//     const result = await client.query({
//       query: SEARCH_STOCKS,
//       variables: { query: `%${query}%` },
//       fetchPolicy: "network-only"
//     })

//     return result.data?.stocksCollection?.edges?.map((e: any) => ({
//       id: e.node.id,
//       instrumentId: e.node.instrumentId,
//       exchange: e.node.exchange,
//       ticker: e.node.ticker,
//       name: e.node.name,
//       ltp: toNumber(e.node.ltp),
//       change: toNumber(e.node.change),
//       changePercent: toNumber(e.node.changePercent),
//       sector: e.node.sector
//     })) ?? []
//   } catch (error) {
//     console.error("Search error:", error)
//     return []
//   }
// }

// /**
//  * Creates a new position or updates an existing one based on an executed order.
//  * This simulates the backend process that would happen after an order fills.
//  */
// async function createOrUpdatePosition(
//   apolloClient: any,
//   executedOrder: {
//     tradingAccountId: string
//     symbol: string
//     quantity: number
//     orderSide: "BUY" | "SELL"
//     price: string
//     stockId?: string | null
//   },
// ) {
//   // 1. Check if a position already exists for this symbol
//   const { data } = await apolloClient.query({
//     query: GET_POSITION_BY_SYMBOL,
//     variables: {
//       tradingAccountId: executedOrder.tradingAccountId,
//       symbol: executedOrder.symbol,
//     },
//     fetchPolicy: "network-only",
//   })

//   const existingPosition = data.positionsCollection?.edges?.[0]?.node

//   if (existingPosition) {
//     // 2. Position exists: Update it
//     const currentQty = Number(existingPosition.quantity)
//     const currentAvgPrice = toNumber(existingPosition.averagePrice)
//     const orderQty = executedOrder.orderSide === "BUY" ? executedOrder.quantity : -executedOrder.quantity

//     const newQty = currentQty + orderQty

//     if (newQty === 0) {
//       // If quantity becomes zero, close (delete) the position
//       await apolloClient.mutate({
//         mutation: DELETE_POSITION,
//         variables: { id: existingPosition.id },
//       })
//     } else {
//       // Calculate new average price (weighted average)
//       const newAvgPrice = ((currentAvgPrice * currentQty) + (executedOrder.price * orderQty)) / newQty

//       await apolloClient.mutate({
//         mutation: UPDATE_POSITION,
//         variables: {
//           id: existingPosition.id,
//           set: {
//             quantity: newQty,
//             averagePrice: newAvgPrice,
//             updatedAt: new Date().toISOString(),
//           },
//         },
//       })
//     }
//   } else {
//     // 3. No position exists: Create a new one
//     const positionId = generateUUID()
//     const quantity = executedOrder.orderSide === "BUY" ? executedOrder.quantity : -executedOrder.quantity

//     await apolloClient.mutate({
//       mutation: INSERT_POSITION,
//       variables: {
//         objects: [{
//           id: positionId,
//           tradingAccountId: executedOrder.tradingAccountId,
//           symbol: executedOrder.symbol,
//           quantity: quantity,
//           averagePrice: executedOrder.price,
//           stockId: executedOrder.stockId,
//           createdAt: new Date().toISOString(),
//         }],
//       },
//     })
//   }
// }

// // -----------------------------
// // Actions used by UI components
// // -----------------------------

// export async function placeOrder(orderData: {
//   userId: string
//   symbol: string
//   stockId: string
//   quantity: number
//   price?: string | null
//   orderType: OrderType
//   orderSide: OrderSide
//   productType?: string
// }) {
//   try {
//     // Ensure user + account exists
//     const { tradingAccountId } = await ensureUserAndAccount(client, orderData.userId)

//     const orderId = generateUUID()
//     const executionPrice = orderData.price ?? "0" // For market orders, you'd fetch the LTP

//     const orderObject =  {
//         id: orderId,
//         tradingAccountId,
//         symbol: orderData.symbol,
//         stockId: orderData.stockId,
//         quantity: orderData.quantity,
//         price: executionPrice,
//         orderType: orderData.orderType.toUpperCase(),
//         orderSide: orderData.orderSide.toUpperCase(),
//         productType: (orderData.productType ?? "MIS").toUpperCase(),
//         status: "PENDING",
//         filledQuantity: 0,
//         createdAt: new Date().toISOString()
//       }
    

//     // 👇 DEBUGGING STEP: Log the object right before sending it
//     console.log("Sending order object:", JSON.stringify(orderObject, null, 2));

//     // 1. Insert the order as PENDING
//     await client.mutate({
//       mutation: INSERT_ORDER,
//       variables: { objects: orderObject },
//     })

//     // 2. SIMULATE EXECUTION: In a real app, a backend worker would do this.
//     // We wait 1 second, then update the order to EXECUTED and create the position.
//     setTimeout(async () => {
//       try {
//         // Update order status to EXECUTED
//         await client.mutate({
//           mutation: UPDATE_ORDER,
//           variables: {
//             id: orderId,
//             set: {
//               status: "EXECUTED",
//               filledQuantity: orderData.quantity,
//               averagePrice: executionPrice,
//               executedAt: new Date().toISOString(),
//             },
//           },
//         })
//         // 3. Create or update the corresponding position
//         await createOrUpdatePosition(client, {
//           tradingAccountId,
//           symbol: orderData.symbol,
//           stockId: orderData.stockId,
//           quantity: orderData.quantity,
//           orderSide: orderData.orderSide,
//           price: executionPrice,
//         })
//       } catch (executionError) {
//         console.error("Error during simulated order execution:", executionError)
//         // Optionally, update order to a FAILED status here
//       }
//     }, 1000) // 1-second delay to simulate market execution


//     return { success: true, orderId }
//   } catch (error) {
//     console.error("Error placing order:", error)
//     console.error("GraphQL Error Details:", JSON.stringify(error, null, 2));
//     throw new Error("Failed to place order. Please try again.")
//   }
// }

// export async function cancelOrder(orderId: string) {
//   try {
//     await client.mutate({
//       mutation: UPDATE_ORDER,
//       variables: {
//         id: orderId,
//         set: {
//           status: "CANCELLED",
//           // updatedAt: new Date().toISOString()
//         }
//       },
//     })
//     return { success: true }
//   } catch (error) {
//     console.error("Error cancelling order:", error)
//     throw new Error("Failed to cancel order. Please try again.")
//   }
// }

// export async function modifyOrder(orderId: string, updates: { price?: number; quantity?: number }) {
//   try {
//     const set: Record<string, any> = {
//       updatedAt: new Date().toISOString()
//     }

//     if (typeof updates.price === "number") set.price = updates.price
//     if (typeof updates.quantity === "number") set.quantity = updates.quantity

//     await client.mutate({
//       mutation: UPDATE_ORDER,
//       variables: { id: orderId, set },
//     })
//     return { success: true }
//   } catch (error) {
//     console.error("Error modifying order:", error)
//     throw new Error("Failed to modify order. Please try again.")
//   }
// }

// export async function deleteOrder(orderId: string) {
//   try {
//     await client.mutate({
//       mutation: DELETE_ORDER,
//       variables: { id: orderId },
//     })
//     return { success: true }
//   } catch (error) {
//     console.error("Error deleting order:", error)
//     throw new Error("Failed to delete order. Please try again.")
//   }
// }

// export async function closePosition(positionId: string) {
//   try {
//     // In a real trading system, this would place a market order to close the position
//     // For now, we'll just delete the position record
//     await client.mutate({
//       mutation: DELETE_POSITION,
//       variables: { id: positionId },
//     })
//     return { success: true }
//   } catch (error) {
//     console.error("Error closing position:", error)
//     throw new Error("Failed to close position. Please try again.")
//   }
// }

// export async function updateStopLoss(positionId: string, stopLoss: number) {
//   try {
//     await client.mutate({
//       mutation: UPDATE_POSITION,
//       variables: {
//         id: positionId,
//         set: {
//           stopLoss,
//           updatedAt: new Date().toISOString()
//         }
//       },
//     })
//     return { success: true }
//   } catch (error) {
//     console.error("Error updating stop loss:", error)
//     throw new Error("Failed to update stop loss. Please try again.")
//   }
// }

// export async function updateTarget(positionId: string, target: number) {
//   try {
//     await client.mutate({
//       mutation: UPDATE_POSITION,
//       variables: {
//         id: positionId,
//         set: {
//           target,
//           updatedAt: new Date().toISOString()
//         }
//       },
//     })
//     return { success: true }
//   } catch (error) {
//     console.error("Error updating target:", error)
//     throw new Error("Failed to update target. Please try again.")
//   }
// }


"use client"
import { useQuery } from "@apollo/client/react"
import { gql } from "@apollo/client/core"
import client from "@/lib/graphql/apollo-client"
import { OrderSide, OrderType } from "@/prisma/generated/client"
import { ToEnum } from "zod/v4/core/util.cjs"
import { useEffect, useState, useMemo } from "react"


// Poll intervals (ms)
const LTP_POLL_INTERVAL = 3000 // For fetching live prices
const ORDERS_POLL = 30000
const PORTFOLIO_POLL = 60000
const POSITIONS_POLL = 5000 // For fetching base position data

// -----------------------------
// GraphQL Documents (Fixed for Supabase Auto-gen)
// -----------------------------

// Users - using correct table name from schema
const GET_USER = gql`
  query GetUser($id: UUID!) {
    usersCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          email
          name
          role
          isActive
          createdAt
        }
      }
    }
  }
`

const INSERT_USER = gql`
  mutation InsertUser($objects: [usersInsertInput!]!) {
    insertIntousersCollection(objects: $objects) {
      records {
        id
        email
        name
        role
      }
    }
  }
`

// Trading Account - using correct mapped table name
const GET_ACCOUNT_BY_USER = gql`
  query GetAccountByUser($userId: UUID!) {
    trading_accountsCollection(filter: { userId: { eq: $userId } }) {
      edges {
        node {
          id
          userId
          balance
          availableMargin
          usedMargin
          createdAt
          updatedAt
        }
      }
    }
  }
`

const INSERT_ACCOUNT = gql`
  mutation InsertAccount($objects: [trading_accountsInsertInput!]!) {
    insertIntotrading_accountsCollection(objects: $objects) {
      records {
        id
        userId
        balance
        availableMargin
        usedMargin
      }
    }
  }
`

// Positions - using correct mapped table name
const GET_POSITIONS = gql`
  query GetPositions($tradingAccountId: UUID!) {
    positionsCollection(
      filter: { tradingAccountId: { eq: $tradingAccountId } }
      orderBy: [{ createdAt: DescNullsLast }]
    ) {
      edges {
        node {
          id
          tradingAccountId
          symbol
          quantity
          averagePrice
          unrealizedPnL
          dayPnL
          stopLoss
          target
          createdAt
          stock {
            id
            ticker
            name
            ltp
            change
            changePercent
            instrumentId
          }
        }
      }
    }
  }
`

const UPDATE_POSITION = gql`
  mutation UpdatePosition($id: UUID!, $set: positionsUpdateInput!) {
    updatepositionsCollection(set: $set, filter: { id: { eq: $id } }) {
      affectedCount
      records {
        id
        stopLoss
        target
      }
    }
  }
`

const DELETE_POSITION = gql`
  mutation DeletePosition($id: UUID!) {
    deleteFrompositionsCollection(filter: { id: { eq: $id } }) {
      affectedCount
    }
  }
`

// Query to find an existing position for a given symbol and account
const GET_POSITION_BY_SYMBOL = gql`
  query GetPositionBySymbol($tradingAccountId: UUID!, $symbol: String!) {
    positionsCollection(
      filter: {
        tradingAccountId: { eq: $tradingAccountId }
        symbol: { eq: $symbol }
      }
    ) {
      edges {
        node {
          id
          quantity
          averagePrice
        }
      }
    }
  }
`

// Mutation to insert a new position
const INSERT_POSITION = gql`
  mutation InsertPosition($objects: [positionsInsertInput!]!) {
    insertIntopositionsCollection(objects: $objects) {
      records {
        id
        symbol
        quantity
      }
    }
  }
`

// Orders - using correct mapped table name
const GET_ORDERS = gql`
  query GetOrders($tradingAccountId: UUID!) {
    ordersCollection(
      filter: { tradingAccountId: { eq: $tradingAccountId } }
      orderBy: [{ createdAt: DescNullsLast }]
    ) {
      edges {
        node {
          id
          tradingAccountId
          symbol
          quantity
          orderType
          orderSide
          price
          filledQuantity
          averagePrice
          productType
          status
          createdAt
          executedAt
          stock {
            id
            ticker
            name
            ltp
          }
        }
      }
    }
  }
`

const INSERT_ORDER = gql`
  mutation InsertOrder($objects: [ordersInsertInput!]!) {
    insertIntoordersCollection(objects: $objects) {
      records {
        id
        symbol
        quantity
        orderType
        orderSide
        status
      }
    }
  }
`

const UPDATE_ORDER = gql`
  mutation UpdateOrder($id: UUID!, $set: ordersUpdateInput!) {
    updateordersCollection(set: $set, filter: { id: { eq: $id } }) {
      affectedCount
      records {
        id
        status
      }
    }
  }
`

const DELETE_ORDER = gql`
  mutation DeleteOrder($id: UUID!) {
    deleteFromordersCollection(filter: { id: { eq: $id } }) {
      affectedCount
    }
  }
`

// Stocks - for watchlist data
const GET_STOCKS_FOR_WATCHLIST = gql`
  query GetStocks($limit: Int = 10) {
    stockCollection(
      filter: { isActive: { eq: true } }
      orderBy: [{ changePercent: DescNullsLast }]
      first: $limit
    ) {
      edges {
        node {
          id
          instrumentId
          exchange
          ticker
          name
          ltp
          open
          high
          low
          close
          volume
          change
          changePercent
          sector
          isActive
          updatedAt
        }
      }
    }
  }
`

// Search stocks
const SEARCH_STOCKS = gql`
  query SearchStocks($query: String!) {
    stocksCollection(
      filter: {
        and: [
          { isActive: { eq: true } }
          {
            or: [
              { name: { ilike: $query } }
              { ticker: { ilike: $query } }
            ]
          }
        ]
      }
      first: 10
    ) {
      edges {
        node {
          id
          ticker
          name
          ltp
          change
          changePercent
          sector
          exchange
        }
      }
    }
  }
`

// -----------------------------
// Helper functions
// -----------------------------

const toNumber = (v: any): number => {
  if (v == null) return 0
  if (typeof v === "number") return v
  if (typeof v === "string") {
    const parsed = parseFloat(v)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function ensureUserAndAccount(
  apolloClient: any,
  userId: string,
  defaultFunding = 250000,
): Promise<{ tradingAccountId: string }> {
  try {
    const userRes = await apolloClient.query({
      query: GET_USER,
      variables: { id: userId },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    })

    const userExists = (userRes.data?.usersCollection?.edges?.length ?? 0) > 0

    if (!userExists) {
      try {
        await apolloClient.mutate({
          mutation: INSERT_USER,
          variables: {
            objects: [{
              id: userId,
              isActive: true,
              role: "USER",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }],
          },
        })
      } catch (insertError) {
        console.error("Error inserting user:", insertError)
      }
    }

    const acctRes = await apolloClient.query({
      query: GET_ACCOUNT_BY_USER,
      variables: { userId },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    })

    const acctNode = acctRes.data?.trading_accountsCollection?.edges?.[0]?.node
    if (acctNode?.id) {
      return { tradingAccountId: acctNode.id }
    }

    const accountId = generateUUID()
    await apolloClient.mutate({
      mutation: INSERT_ACCOUNT,
      variables: {
        objects: [
          {
            id: accountId,
            userId,
            balance: defaultFunding,
            availableMargin: defaultFunding,
            usedMargin: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
        ],
      },
    })

    return { tradingAccountId: accountId }
  } catch (error) {
    console.error("Error in ensureUserAndAccount:", error)
    throw new Error("Failed to initialize user account")
  }
}

// -----------------------------
// Hooks
// -----------------------------

export function usePortfolio(userId?: string) {
  const {
    data: acctData,
    refetch: refetchAcct,
    loading: loadingAcct,
    error: errorAcct
  } = useQuery(GET_ACCOUNT_BY_USER, {
    variables: { userId: userId ?? "" },
    pollInterval: PORTFOLIO_POLL,
    skip: !userId,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true
  })

  async function ensure() {
    if (!userId) return null
    try {
      const acctNode = acctData?.trading_accountsCollection?.edges?.[0]?.node
      if (acctNode?.id) return acctNode

      await ensureUserAndAccount(client, userId)
      await refetchAcct()
      return null
    } catch (error) {
      console.error("Error ensuring user account:", error)
      return null
    }
  }

  const account = acctData?.trading_accountsCollection?.edges?.[0]?.node
  const balance = toNumber(account?.balance)
  const usedMargin = toNumber(account?.usedMargin)
  const availableMargin = toNumber(account?.availableMargin)
  const totalValue = balance || (availableMargin + usedMargin)

  return {
    portfolio: account ? {
      account: {
        totalValue,
        totalPnL: 0, 
        availableMargin,
        usedMargin,
        balance
      },
    } : null,
    isLoading: loadingAcct,
    isError: !!errorAcct,
    error: errorAcct,
    mutate: async () => {
      await refetchAcct()
    },
    ensure,
  }
}

export function useWatchlist() {
    const { data, loading, error, refetch } = useQuery(GET_STOCKS_FOR_WATCHLIST, {
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    });
  
    const [liveWatchlist, setLiveWatchlist] = useState<any[]>([]);
  
    const initialWatchlist = useMemo(() => {
      return (
        data?.stockCollection?.edges?.map((e: any) => ({
          id: e.node.id,
          instrumentId: e.node.instrumentId,
          symbol: e.node.ticker,
          name: e.node.name,
          ltp: toNumber(e.node.ltp),
          change: toNumber(e.node.change),
          changePercent: toNumber(e.node.changePercent),
          high: toNumber(e.node.high),
          low: toNumber(e.node.low),
          open: toNumber(e.node.open),
          close: toNumber(e.node.close),
          volume: toNumber(e.node.volume),
          sector: e.node.sector,
          exchange: e.node.exchange,
          lastUpdated: e.node.updatedAt,
        })) ?? []
      );
    }, [data]);
  
    useEffect(() => {
      if (initialWatchlist.length > 0) {
        setLiveWatchlist(initialWatchlist);
      }
    }, [initialWatchlist]);
  
    useEffect(() => {
      if (initialWatchlist.length === 0) return;
  
      const instrumentIds = initialWatchlist.map((item) => item.instrumentId).filter(Boolean);
      if (instrumentIds.length === 0) return;
  
      const fetchLTPs = async () => {
        try {
          const params = new URLSearchParams();
          instrumentIds.forEach((id) => params.append('q', id));
          const res = await fetch(`/api/quotes?${params.toString()}`);
          if (!res.ok) {
            console.error("Failed to fetch quotes, status:", res.status);
            return;
          }
          const quoteData = await res.json();
  
          if (quoteData.status === 'success' && quoteData.data) {
            setLiveWatchlist((currentWatchlist) => {
              const baseWatchlist = currentWatchlist.length > 0 ? currentWatchlist : initialWatchlist;
              return baseWatchlist.map((item) => {
                const liveData = quoteData.data[item.instrumentId];
                if (liveData) {
                  const newLtp = liveData.last_trade_price;
                  const change = newLtp - item.close;
                  const changePercent = (change / item.close) * 100;
                  return {
                    ...item,
                    ltp: newLtp,
                    change: change,
                    changePercent: isFinite(changePercent) ? changePercent : 0,
                  };
                }
                return item;
              });
            });
          }
        } catch (err) {
          console.error("Failed to fetch live watchlist data:", err);
        }
      };
  
      const interval = setInterval(fetchLTPs, LTP_POLL_INTERVAL);
      fetchLTPs(); 
  
      return () => clearInterval(interval);
    }, [initialWatchlist]);
  
    return {
      watchlist: liveWatchlist,
      isLoading: loading && liveWatchlist.length === 0,
      isError: !!error,
      error,
      mutate: refetch,
    };
}

function useAccountId(userId?: string) {
  const { data, error } = useQuery(GET_ACCOUNT_BY_USER, {
    variables: { userId: userId ?? "" },
    skip: !userId,
    pollInterval: PORTFOLIO_POLL,
    errorPolicy: "all"
  })

  if (error) {
    console.error("Error fetching account:", error)
  }

  const id = data?.trading_accountsCollection?.edges?.[0]?.node?.id
  return id as string | undefined
}

export function useOrders(userId?: string) {
  const tradingAccountId = useAccountId(userId)
  const { data, loading, error, refetch } = useQuery(GET_ORDERS, {
    variables: { tradingAccountId: tradingAccountId ?? "" },
    skip: !tradingAccountId,
    pollInterval: ORDERS_POLL,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true
  })

  const orders =
    data?.ordersCollection?.edges?.map((e: any) => ({
      ...e.node,
      price: e.node.price != null ? toNumber(e.node.price) : null,
      averagePrice: e.node.averagePrice != null ? toNumber(e.node.averagePrice) : null,
      stockName: e.node.Stock?.name || e.node.symbol,
      currentPrice: e.node.Stock ? toNumber(e.node.Stock.ltp) : null
    })) ?? []

  return {
    orders,
    isLoading: loading || !tradingAccountId,
    isError: !!error,
    error,
    mutate: refetch,
  }
}

export function usePositions(userId?: string) {
    const tradingAccountId = useAccountId(userId);
    const { data, loading, error, refetch } = useQuery(GET_POSITIONS, {
      variables: { tradingAccountId: tradingAccountId ?? "" },
      skip: !tradingAccountId,
      pollInterval: POSITIONS_POLL,
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    });
  
    const [livePositions, setLivePositions] = useState<any[]>([]);
  
    const initialPositions = useMemo(() => {
      return (
        data?.positionsCollection?.edges?.map((e: any) => ({
          ...e.node,
          averagePrice: toNumber(e.node.averagePrice),
          unrealizedPnL: toNumber(e.node.unrealizedPnL),
          dayPnL: toNumber(e.node.dayPnL),
          stopLoss: e.node.stopLoss != null ? toNumber(e.node.stopLoss) : undefined,
          target: e.node.target != null ? toNumber(e.node.target) : undefined,
          currentPrice: e.node.stock ? toNumber(e.node.stock.ltp) : toNumber(e.node.averagePrice),
          instrumentId: e.node.stock?.instrumentId,
          stockName: e.node.stock?.name || e.node.symbol,
          change: e.node.stock ? toNumber(e.node.stock.change) : 0,
          changePercent: e.node.stock ? toNumber(e.node.stock.changePercent) : 0,
        })) ?? []
      );
    }, [data]);
  
    useEffect(() => {
      if (initialPositions.length > 0) {
        setLivePositions(initialPositions);
      } else {
        setLivePositions([]);
      }
    }, [initialPositions]);
  
    useEffect(() => {
      if (initialPositions.length === 0) return;
  
      const instrumentIds = initialPositions.map((p) => p.instrumentId).filter(Boolean);
      if (instrumentIds.length === 0) return;
  
      const fetchLTPs = async () => {
        try {
          const params = new URLSearchParams();
          instrumentIds.forEach((id) => params.append('q', id));
          const res = await fetch(`/api/quotes?${params.toString()}`);
          if (!res.ok) return;
          const quoteData = await res.json();
  
          if (quoteData.status === 'success' && quoteData.data) {
            setLivePositions((currentPositions) => {
              const basePositions = currentPositions.length > 0 ? currentPositions : initialPositions;
              return basePositions.map((pos) => {
                const liveData = quoteData.data[pos.instrumentId];
                if (liveData) {
                  const currentPrice = liveData.last_trade_price;
                  const unrealizedPnL = (currentPrice - pos.averagePrice) * pos.quantity;
                  return { ...pos, currentPrice, unrealizedPnL };
                }
                return pos;
              });
            });
          }
        } catch (err) {
          console.error("Failed to fetch live position data:", err);
        }
      };
  
      const interval = setInterval(fetchLTPs, LTP_POLL_INTERVAL);
      fetchLTPs();
  
      return () => clearInterval(interval);
    }, [initialPositions]);
  
    return {
      positions: livePositions,
      isLoading: loading || !tradingAccountId,
      isError: !!error,
      error,
      mutate: refetch,
    };
}

export async function searchStocks(query: string) {
  try {
    const result = await client.query({
      query: SEARCH_STOCKS,
      variables: { query: `%${query}%` },
      fetchPolicy: "network-only"
    })

    return result.data?.stocksCollection?.edges?.map((e: any) => ({
      id: e.node.id,
      instrumentId: e.node.instrumentId,
      exchange: e.node.exchange,
      ticker: e.node.ticker,
      name: e.node.name,
      ltp: toNumber(e.node.ltp),
      change: toNumber(e.node.change),
      changePercent: toNumber(e.node.changePercent),
      sector: e.node.sector
    })) ?? []
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

async function createOrUpdatePosition(
  apolloClient: any,
  executedOrder: {
    tradingAccountId: string
    symbol: string
    quantity: number
    orderSide: "BUY" | "SELL"
    price: number
    stockId?: string | null
  },
) {
  const { data } = await apolloClient.query({
    query: GET_POSITION_BY_SYMBOL,
    variables: {
      tradingAccountId: executedOrder.tradingAccountId,
      symbol: executedOrder.symbol,
    },
    fetchPolicy: "network-only",
  })

  const existingPosition = data.positionsCollection?.edges?.[0]?.node

  if (existingPosition) {
    const currentQty = Number(existingPosition.quantity)
    const currentAvgPrice = toNumber(existingPosition.averagePrice)
    const orderQty = executedOrder.orderSide === "BUY" ? executedOrder.quantity : -executedOrder.quantity
    const orderPrice = executedOrder.price;

    const newQty = currentQty + orderQty

    if (newQty === 0) {
      await apolloClient.mutate({
        mutation: DELETE_POSITION,
        variables: { id: existingPosition.id },
      })
    } else {
      const newAvgPrice = ((currentAvgPrice * currentQty) + (orderPrice * orderQty)) / newQty

      await apolloClient.mutate({
        mutation: UPDATE_POSITION,
        variables: {
          id: existingPosition.id,
          set: {
            quantity: newQty,
            averagePrice: newAvgPrice.toFixed(2),
            updatedAt: new Date().toISOString(),
          },
        },
      })
    }
  } else {
    const positionId = generateUUID()
    const quantity = executedOrder.orderSide === "BUY" ? executedOrder.quantity : -executedOrder.quantity

    await apolloClient.mutate({
      mutation: INSERT_POSITION,
      variables: {
        objects: [{
          id: positionId,
          tradingAccountId: executedOrder.tradingAccountId,
          symbol: executedOrder.symbol,
          quantity: quantity,
          averagePrice: executedOrder.price.toFixed(2),
          stockId: executedOrder.stockId,
          createdAt: new Date().toISOString(),
        }],
      },
    })
  }
}

// -----------------------------
// Actions used by UI components
// -----------------------------

export async function placeOrder(orderData: {
  userId: string
  symbol: string
  stockId: string
  instrumentId: string
  quantity: number
  price?: number | null
  orderType: OrderType
  orderSide: OrderSide
  productType?: string
}) {
  try {
    const { tradingAccountId } = await ensureUserAndAccount(client, orderData.userId)
    const orderId = generateUUID()
    
    let executionPrice = orderData.price ?? 0;

    // If it's a market order, fetch the latest price
    if (orderData.orderType === 'MARKET') {
        try {
            const res = await fetch(`/api/quotes?q=${orderData.instrumentId}&mode=ltp`);
            const quoteData = await res.json();
            if (quoteData.status === 'success' && quoteData.data[orderData.instrumentId]) {
                executionPrice = quoteData.data[orderData.instrumentId].last_trade_price;
            } else {
                throw new Error('Could not fetch LTP for market order');
            }
        } catch (e) {
            console.error(e);
            throw new Error('Failed to fetch price for market order.');
        }
    }


    const orderObject =  {
        id: orderId,
        tradingAccountId,
        symbol: orderData.symbol,
        stockId: orderData.stockId,
        quantity: orderData.quantity,
        price: executionPrice,
        orderType: orderData.orderType.toUpperCase(),
        orderSide: orderData.orderSide.toUpperCase(),
        productType: (orderData.productType ?? "MIS").toUpperCase(),
        status: "PENDING",
        filledQuantity: 0,
        createdAt: new Date().toISOString()
      }
    
    await client.mutate({
      mutation: INSERT_ORDER,
      variables: { objects: orderObject },
    })

    setTimeout(async () => {
      try {
        await client.mutate({
          mutation: UPDATE_ORDER,
          variables: {
            id: orderId,
            set: {
              status: "EXECUTED",
              filledQuantity: orderData.quantity,
              averagePrice: executionPrice.toFixed(2),
              executedAt: new Date().toISOString(),
            },
          },
        })
        await createOrUpdatePosition(client, {
          tradingAccountId,
          symbol: orderData.symbol,
          stockId: orderData.stockId,
          quantity: orderData.quantity,
          orderSide: orderData.orderSide,
          price: executionPrice,
        })
      } catch (executionError) {
        console.error("Error during simulated order execution:", executionError)
      }
    }, 1000) 


    return { success: true, orderId }
  } catch (error) {
    console.error("Error placing order:", error)
    console.error("GraphQL Error Details:", JSON.stringify(error, null, 2));
    throw new Error("Failed to place order. Please try again.")
  }
}

export async function cancelOrder(orderId: string) {
  try {
    await client.mutate({
      mutation: UPDATE_ORDER,
      variables: {
        id: orderId,
        set: {
          status: "CANCELLED",
        }
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error cancelling order:", error)
    throw new Error("Failed to cancel order. Please try again.")
  }
}

export async function modifyOrder(orderId: string, updates: { price?: number; quantity?: number }) {
  try {
    const set: Record<string, any> = {
      updatedAt: new Date().toISOString()
    }

    if (typeof updates.price === "number") set.price = updates.price
    if (typeof updates.quantity === "number") set.quantity = updates.quantity

    await client.mutate({
      mutation: UPDATE_ORDER,
      variables: { id: orderId, set },
    })
    return { success: true }
  } catch (error) {
    console.error("Error modifying order:", error)
    throw new Error("Failed to modify order. Please try again.")
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await client.mutate({
      mutation: DELETE_ORDER,
      variables: { id: orderId },
    })
    return { success: true }
  } catch (error) {
    console.error("Error deleting order:", error)
    throw new Error("Failed to delete order. Please try again.")
  }
}

export async function closePosition(positionId: string) {
  try {
    await client.mutate({
      mutation: DELETE_POSITION,
      variables: { id: positionId },
    })
    return { success: true }
  } catch (error) {
    console.error("Error closing position:", error)
    throw new Error("Failed to close position. Please try again.")
  }
}

export async function updateStopLoss(positionId: string, stopLoss: number) {
  try {
    await client.mutate({
      mutation: UPDATE_POSITION,
      variables: {
        id: positionId,
        set: {
          stopLoss,
          updatedAt: new Date().toISOString()
        }
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error updating stop loss:", error)
    throw new Error("Failed to update stop loss. Please try again.")
  }
}

export async function updateTarget(positionId: string, target: number) {
  try {
    await client.mutate({
      mutation: UPDATE_POSITION,
      variables: {
        id: positionId,
        set: {
          target,
          updatedAt: new Date().toISOString()
        }
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error updating target:", error)
    throw new Error("Failed to update target. Please try again.")
  }
}
