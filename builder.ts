import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import RelayPlugin from '@pothos/plugin-relay';
import ValidationPlugin from '@pothos/plugin-validation';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
// @ts-ignore
import type PrismaTypes from '../generated/pothos-types';
import { PrismaClient } from './prisma/generated/client';

export interface Context {
  prisma: PrismaClient;
  user?: {
    id: string;
    role: string;
  };
}

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: Context;
  AuthScopes: {
    authenticated: boolean;
    admin: boolean;
    owner: boolean;
  };
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
  };
}>({
  plugins: [
    PrismaPlugin,
    RelayPlugin,
    ValidationPlugin,
    ScopeAuthPlugin,
  ],
  prisma: {
    client: new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    }),
    filterConnectionTotalCount: true,
    onUnusedQuery: process.env.NODE_ENV === 'production' ? null : 'warn',
  },
  relay: {
    clientMutationId: 'omit',
    cursorType: 'String',
  },
});

// Base Query and Mutation types
builder.queryType({
  description: 'The root query type',
});

builder.mutationType({
  description: 'The root mutation type',
});

// Health check query
builder.queryField('health', (t) =>
  t.string({
    description: 'Health check endpoint',
    resolve: () => 'OK',
  })
);

// Current user query
builder.queryField('me', (t) =>
  t.prismaField({
    type: 'User',
    nullable: true,
    authScopes: {
      authenticated: true,
    },
    resolve: async (query, root, args, ctx) => {
      if (!ctx.user) return null;
      return await ctx.prisma.user.findUnique({
        ...query,
        where: { id: ctx.user.id },
      });
    },
  })
);

export { PrismaClient };