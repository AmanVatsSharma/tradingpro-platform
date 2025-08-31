import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client"

const client = new ApolloClient({
  link: new HttpLink({
    uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
    },
  }),
  cache: new InMemoryCache(),
})

export default client
