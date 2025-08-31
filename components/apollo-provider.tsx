"use client"

import type React from "react"

// Use the react entry to avoid export issues in some bundlers
import { ApolloProvider } from "@apollo/client/react"
import client from "@/lib/graphql/apollo-client"

export default function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Supabase configuration required</h2>
          <p className="mt-2 text-sm text-gray-600">
            Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings to enable the
            GraphQL connection.
          </p>
        </div>
      </div>
    )
  }

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}
