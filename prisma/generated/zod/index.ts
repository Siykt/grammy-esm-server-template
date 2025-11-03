import { z } from 'zod';
import type { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','telegramId','username','firstName','lastName','photoUrl','createdAt','updatedAt']);

export const TelegramMessageSessionScalarFieldEnumSchema = z.enum(['id','key','value']);

export const ExchangeCredentialScalarFieldEnumSchema = z.enum(['id','exchangeId','apiKeyEnc','apiSecretEnc','passphraseEnc','createdAt','updatedAt']);

export const TradingPairScalarFieldEnumSchema = z.enum(['id','symbol','base','quote','isLinear','enabled','notes','addedByTg','createdAt','updatedAt']);

export const NotificationScalarFieldEnumSchema = z.enum(['id','level','channel','title','content','target','meta','status','error','sentAt','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullsOrderSchema = z.enum(['first','last']);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

/**
 * User model
 */
export const UserSchema = z.object({
  /**
   * user id
   */
  id: z.string(),
  /**
   * telegram user id
   */
  telegramId: z.string(),
  /**
   * telegram username
   */
  username: z.string().nullable(),
  /**
   * telegram first name
   */
  firstName: z.string().nullable(),
  /**
   * telegram last name
   */
  lastName: z.string().nullable(),
  /**
   * telegram photo url
   */
  photoUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// TELEGRAM MESSAGE SESSION SCHEMA
/////////////////////////////////////////

/**
 * Telegram message session
 */
export const TelegramMessageSessionSchema = z.object({
  id: z.number().int(),
  key: z.string(),
  value: z.string(),
})

export type TelegramMessageSession = z.infer<typeof TelegramMessageSessionSchema>

/////////////////////////////////////////
// EXCHANGE CREDENTIAL SCHEMA
/////////////////////////////////////////

/**
 * 交易所 API 凭证（使用 SERVER_AUTH_PASSWORD 加密后存储）
 */
export const ExchangeCredentialSchema = z.object({
  id: z.string(),
  exchangeId: z.string(),
  apiKeyEnc: z.string(),
  apiSecretEnc: z.string(),
  passphraseEnc: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ExchangeCredential = z.infer<typeof ExchangeCredentialSchema>

/////////////////////////////////////////
// TRADING PAIR SCHEMA
/////////////////////////////////////////

/**
 * 监控的交易对（统一使用 base/quote 与原始 symbol 存储）
 */
export const TradingPairSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  base: z.string(),
  quote: z.string(),
  isLinear: z.boolean(),
  enabled: z.boolean(),
  notes: z.string().nullable(),
  addedByTg: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TradingPair = z.infer<typeof TradingPairSchema>

/////////////////////////////////////////
// NOTIFICATION SCHEMA
/////////////////////////////////////////

/**
 * 通知记录（每次发送一条记录）
 */
export const NotificationSchema = z.object({
  id: z.string(),
  level: z.string(),
  channel: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  target: z.string().nullable(),
  meta: z.string().nullable(),
  status: z.string(),
  error: z.string().nullable(),
  sentAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Notification = z.infer<typeof NotificationSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  id: z.boolean().optional(),
  telegramId: z.boolean().optional(),
  username: z.boolean().optional(),
  firstName: z.boolean().optional(),
  lastName: z.boolean().optional(),
  photoUrl: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// TELEGRAM MESSAGE SESSION
//------------------------------------------------------

export const TelegramMessageSessionSelectSchema: z.ZodType<Prisma.TelegramMessageSessionSelect> = z.object({
  id: z.boolean().optional(),
  key: z.boolean().optional(),
  value: z.boolean().optional(),
}).strict()

// EXCHANGE CREDENTIAL
//------------------------------------------------------

export const ExchangeCredentialSelectSchema: z.ZodType<Prisma.ExchangeCredentialSelect> = z.object({
  id: z.boolean().optional(),
  exchangeId: z.boolean().optional(),
  apiKeyEnc: z.boolean().optional(),
  apiSecretEnc: z.boolean().optional(),
  passphraseEnc: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// TRADING PAIR
//------------------------------------------------------

export const TradingPairSelectSchema: z.ZodType<Prisma.TradingPairSelect> = z.object({
  id: z.boolean().optional(),
  symbol: z.boolean().optional(),
  base: z.boolean().optional(),
  quote: z.boolean().optional(),
  isLinear: z.boolean().optional(),
  enabled: z.boolean().optional(),
  notes: z.boolean().optional(),
  addedByTg: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

// NOTIFICATION
//------------------------------------------------------

export const NotificationSelectSchema: z.ZodType<Prisma.NotificationSelect> = z.object({
  id: z.boolean().optional(),
  level: z.boolean().optional(),
  channel: z.boolean().optional(),
  title: z.boolean().optional(),
  content: z.boolean().optional(),
  target: z.boolean().optional(),
  meta: z.boolean().optional(),
  status: z.boolean().optional(),
  error: z.boolean().optional(),
  sentAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  telegramId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  firstName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  photoUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  telegramId: z.lazy(() => SortOrderSchema).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  firstName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  photoUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    telegramId: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    telegramId: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  telegramId: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  firstName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  photoUrl: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  telegramId: z.lazy(() => SortOrderSchema).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  firstName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  photoUrl: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional()
}).strict();

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  telegramId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  firstName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  lastName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  photoUrl: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const TelegramMessageSessionWhereInputSchema: z.ZodType<Prisma.TelegramMessageSessionWhereInput> = z.object({
  AND: z.union([ z.lazy(() => TelegramMessageSessionWhereInputSchema),z.lazy(() => TelegramMessageSessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TelegramMessageSessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TelegramMessageSessionWhereInputSchema),z.lazy(() => TelegramMessageSessionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  key: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const TelegramMessageSessionOrderByWithRelationInputSchema: z.ZodType<Prisma.TelegramMessageSessionOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TelegramMessageSessionWhereUniqueInputSchema: z.ZodType<Prisma.TelegramMessageSessionWhereUniqueInput> = z.union([
  z.object({
    id: z.number().int(),
    key: z.string()
  }),
  z.object({
    id: z.number().int(),
  }),
  z.object({
    key: z.string(),
  }),
])
.and(z.object({
  id: z.number().int().optional(),
  key: z.string().optional(),
  AND: z.union([ z.lazy(() => TelegramMessageSessionWhereInputSchema),z.lazy(() => TelegramMessageSessionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TelegramMessageSessionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TelegramMessageSessionWhereInputSchema),z.lazy(() => TelegramMessageSessionWhereInputSchema).array() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict());

export const TelegramMessageSessionOrderByWithAggregationInputSchema: z.ZodType<Prisma.TelegramMessageSessionOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TelegramMessageSessionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TelegramMessageSessionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TelegramMessageSessionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TelegramMessageSessionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TelegramMessageSessionSumOrderByAggregateInputSchema).optional()
}).strict();

export const TelegramMessageSessionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TelegramMessageSessionScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => TelegramMessageSessionScalarWhereWithAggregatesInputSchema),z.lazy(() => TelegramMessageSessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TelegramMessageSessionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TelegramMessageSessionScalarWhereWithAggregatesInputSchema),z.lazy(() => TelegramMessageSessionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  key: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const ExchangeCredentialWhereInputSchema: z.ZodType<Prisma.ExchangeCredentialWhereInput> = z.object({
  AND: z.union([ z.lazy(() => ExchangeCredentialWhereInputSchema),z.lazy(() => ExchangeCredentialWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ExchangeCredentialWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ExchangeCredentialWhereInputSchema),z.lazy(() => ExchangeCredentialWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  exchangeId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  apiKeyEnc: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  apiSecretEnc: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  passphraseEnc: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const ExchangeCredentialOrderByWithRelationInputSchema: z.ZodType<Prisma.ExchangeCredentialOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  exchangeId: z.lazy(() => SortOrderSchema).optional(),
  apiKeyEnc: z.lazy(() => SortOrderSchema).optional(),
  apiSecretEnc: z.lazy(() => SortOrderSchema).optional(),
  passphraseEnc: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ExchangeCredentialWhereUniqueInputSchema: z.ZodType<Prisma.ExchangeCredentialWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    exchangeId: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    exchangeId: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  exchangeId: z.string().optional(),
  AND: z.union([ z.lazy(() => ExchangeCredentialWhereInputSchema),z.lazy(() => ExchangeCredentialWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => ExchangeCredentialWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ExchangeCredentialWhereInputSchema),z.lazy(() => ExchangeCredentialWhereInputSchema).array() ]).optional(),
  apiKeyEnc: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  apiSecretEnc: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  passphraseEnc: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const ExchangeCredentialOrderByWithAggregationInputSchema: z.ZodType<Prisma.ExchangeCredentialOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  exchangeId: z.lazy(() => SortOrderSchema).optional(),
  apiKeyEnc: z.lazy(() => SortOrderSchema).optional(),
  apiSecretEnc: z.lazy(() => SortOrderSchema).optional(),
  passphraseEnc: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ExchangeCredentialCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ExchangeCredentialMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ExchangeCredentialMinOrderByAggregateInputSchema).optional()
}).strict();

export const ExchangeCredentialScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.ExchangeCredentialScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => ExchangeCredentialScalarWhereWithAggregatesInputSchema),z.lazy(() => ExchangeCredentialScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => ExchangeCredentialScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => ExchangeCredentialScalarWhereWithAggregatesInputSchema),z.lazy(() => ExchangeCredentialScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  exchangeId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  apiKeyEnc: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  apiSecretEnc: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  passphraseEnc: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const TradingPairWhereInputSchema: z.ZodType<Prisma.TradingPairWhereInput> = z.object({
  AND: z.union([ z.lazy(() => TradingPairWhereInputSchema),z.lazy(() => TradingPairWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TradingPairWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TradingPairWhereInputSchema),z.lazy(() => TradingPairWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  symbol: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  base: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  quote: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  isLinear: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  notes: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  addedByTg: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const TradingPairOrderByWithRelationInputSchema: z.ZodType<Prisma.TradingPairOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  symbol: z.lazy(() => SortOrderSchema).optional(),
  base: z.lazy(() => SortOrderSchema).optional(),
  quote: z.lazy(() => SortOrderSchema).optional(),
  isLinear: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  notes: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  addedByTg: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TradingPairWhereUniqueInputSchema: z.ZodType<Prisma.TradingPairWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    symbol: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    symbol: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  symbol: z.string().optional(),
  AND: z.union([ z.lazy(() => TradingPairWhereInputSchema),z.lazy(() => TradingPairWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TradingPairWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TradingPairWhereInputSchema),z.lazy(() => TradingPairWhereInputSchema).array() ]).optional(),
  base: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  quote: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  isLinear: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  notes: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  addedByTg: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const TradingPairOrderByWithAggregationInputSchema: z.ZodType<Prisma.TradingPairOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  symbol: z.lazy(() => SortOrderSchema).optional(),
  base: z.lazy(() => SortOrderSchema).optional(),
  quote: z.lazy(() => SortOrderSchema).optional(),
  isLinear: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  notes: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  addedByTg: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TradingPairCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TradingPairMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TradingPairMinOrderByAggregateInputSchema).optional()
}).strict();

export const TradingPairScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TradingPairScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => TradingPairScalarWhereWithAggregatesInputSchema),z.lazy(() => TradingPairScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TradingPairScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TradingPairScalarWhereWithAggregatesInputSchema),z.lazy(() => TradingPairScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  symbol: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  base: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  quote: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  isLinear: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  notes: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  addedByTg: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const NotificationWhereInputSchema: z.ZodType<Prisma.NotificationWhereInput> = z.object({
  AND: z.union([ z.lazy(() => NotificationWhereInputSchema),z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationWhereInputSchema),z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  level: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  channel: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  content: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  target: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  meta: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  error: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  sentAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const NotificationOrderByWithRelationInputSchema: z.ZodType<Prisma.NotificationOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  level: z.lazy(() => SortOrderSchema).optional(),
  channel: z.lazy(() => SortOrderSchema).optional(),
  title: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  target: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  meta: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  sentAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const NotificationWhereUniqueInputSchema: z.ZodType<Prisma.NotificationWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => NotificationWhereInputSchema),z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationWhereInputSchema),z.lazy(() => NotificationWhereInputSchema).array() ]).optional(),
  level: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  channel: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  content: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  target: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  meta: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  error: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  sentAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const NotificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.NotificationOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  level: z.lazy(() => SortOrderSchema).optional(),
  channel: z.lazy(() => SortOrderSchema).optional(),
  title: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  target: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  meta: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  sentAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => NotificationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => NotificationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => NotificationMinOrderByAggregateInputSchema).optional()
}).strict();

export const NotificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.NotificationScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema),z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema),z.lazy(() => NotificationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  level: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  channel: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  title: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  content: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  target: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  meta: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  error: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  sentAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.object({
  id: z.string().optional(),
  telegramId: z.string(),
  username: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  telegramId: z.string(),
  username: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  telegramId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  photoUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  telegramId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  photoUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.object({
  id: z.string().optional(),
  telegramId: z.string(),
  username: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  telegramId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  photoUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  telegramId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  firstName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  photoUrl: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TelegramMessageSessionCreateInputSchema: z.ZodType<Prisma.TelegramMessageSessionCreateInput> = z.object({
  key: z.string(),
  value: z.string()
}).strict();

export const TelegramMessageSessionUncheckedCreateInputSchema: z.ZodType<Prisma.TelegramMessageSessionUncheckedCreateInput> = z.object({
  id: z.number().int().optional(),
  key: z.string(),
  value: z.string()
}).strict();

export const TelegramMessageSessionUpdateInputSchema: z.ZodType<Prisma.TelegramMessageSessionUpdateInput> = z.object({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TelegramMessageSessionUncheckedUpdateInputSchema: z.ZodType<Prisma.TelegramMessageSessionUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TelegramMessageSessionCreateManyInputSchema: z.ZodType<Prisma.TelegramMessageSessionCreateManyInput> = z.object({
  id: z.number().int().optional(),
  key: z.string(),
  value: z.string()
}).strict();

export const TelegramMessageSessionUpdateManyMutationInputSchema: z.ZodType<Prisma.TelegramMessageSessionUpdateManyMutationInput> = z.object({
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TelegramMessageSessionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TelegramMessageSessionUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  key: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  value: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ExchangeCredentialCreateInputSchema: z.ZodType<Prisma.ExchangeCredentialCreateInput> = z.object({
  id: z.string().optional(),
  exchangeId: z.string(),
  apiKeyEnc: z.string(),
  apiSecretEnc: z.string(),
  passphraseEnc: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ExchangeCredentialUncheckedCreateInputSchema: z.ZodType<Prisma.ExchangeCredentialUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  exchangeId: z.string(),
  apiKeyEnc: z.string(),
  apiSecretEnc: z.string(),
  passphraseEnc: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ExchangeCredentialUpdateInputSchema: z.ZodType<Prisma.ExchangeCredentialUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  exchangeId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  apiKeyEnc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  apiSecretEnc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passphraseEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ExchangeCredentialUncheckedUpdateInputSchema: z.ZodType<Prisma.ExchangeCredentialUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  exchangeId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  apiKeyEnc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  apiSecretEnc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passphraseEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ExchangeCredentialCreateManyInputSchema: z.ZodType<Prisma.ExchangeCredentialCreateManyInput> = z.object({
  id: z.string().optional(),
  exchangeId: z.string(),
  apiKeyEnc: z.string(),
  apiSecretEnc: z.string(),
  passphraseEnc: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const ExchangeCredentialUpdateManyMutationInputSchema: z.ZodType<Prisma.ExchangeCredentialUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  exchangeId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  apiKeyEnc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  apiSecretEnc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passphraseEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const ExchangeCredentialUncheckedUpdateManyInputSchema: z.ZodType<Prisma.ExchangeCredentialUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  exchangeId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  apiKeyEnc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  apiSecretEnc: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  passphraseEnc: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TradingPairCreateInputSchema: z.ZodType<Prisma.TradingPairCreateInput> = z.object({
  id: z.string().optional(),
  symbol: z.string(),
  base: z.string(),
  quote: z.string(),
  isLinear: z.boolean(),
  enabled: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  addedByTg: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const TradingPairUncheckedCreateInputSchema: z.ZodType<Prisma.TradingPairUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  symbol: z.string(),
  base: z.string(),
  quote: z.string(),
  isLinear: z.boolean(),
  enabled: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  addedByTg: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const TradingPairUpdateInputSchema: z.ZodType<Prisma.TradingPairUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  symbol: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  base: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quote: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isLinear: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  notes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addedByTg: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TradingPairUncheckedUpdateInputSchema: z.ZodType<Prisma.TradingPairUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  symbol: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  base: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quote: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isLinear: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  notes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addedByTg: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TradingPairCreateManyInputSchema: z.ZodType<Prisma.TradingPairCreateManyInput> = z.object({
  id: z.string().optional(),
  symbol: z.string(),
  base: z.string(),
  quote: z.string(),
  isLinear: z.boolean(),
  enabled: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  addedByTg: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const TradingPairUpdateManyMutationInputSchema: z.ZodType<Prisma.TradingPairUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  symbol: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  base: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quote: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isLinear: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  notes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addedByTg: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TradingPairUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TradingPairUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  symbol: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  base: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  quote: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  isLinear: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  notes: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  addedByTg: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const NotificationCreateInputSchema: z.ZodType<Prisma.NotificationCreateInput> = z.object({
  id: z.string().optional(),
  level: z.string(),
  channel: z.string(),
  title: z.string().optional().nullable(),
  content: z.string(),
  target: z.string().optional().nullable(),
  meta: z.string().optional().nullable(),
  status: z.string().optional(),
  error: z.string().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const NotificationUncheckedCreateInputSchema: z.ZodType<Prisma.NotificationUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  level: z.string(),
  channel: z.string(),
  title: z.string().optional().nullable(),
  content: z.string(),
  target: z.string().optional().nullable(),
  meta: z.string().optional().nullable(),
  status: z.string().optional(),
  error: z.string().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const NotificationUpdateInputSchema: z.ZodType<Prisma.NotificationUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  level: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  channel: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  target: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  meta: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const NotificationUncheckedUpdateInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  level: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  channel: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  target: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  meta: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const NotificationCreateManyInputSchema: z.ZodType<Prisma.NotificationCreateManyInput> = z.object({
  id: z.string().optional(),
  level: z.string(),
  channel: z.string(),
  title: z.string().optional().nullable(),
  content: z.string(),
  target: z.string().optional().nullable(),
  meta: z.string().optional().nullable(),
  status: z.string().optional(),
  error: z.string().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const NotificationUpdateManyMutationInputSchema: z.ZodType<Prisma.NotificationUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  level: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  channel: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  target: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  meta: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const NotificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.NotificationUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  level: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  channel: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  title: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  content: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  target: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  meta: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  error: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  sentAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.object({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional()
}).strict();

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  telegramId: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  photoUrl: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  telegramId: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  photoUrl: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  telegramId: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  firstName: z.lazy(() => SortOrderSchema).optional(),
  lastName: z.lazy(() => SortOrderSchema).optional(),
  photoUrl: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const TelegramMessageSessionCountOrderByAggregateInputSchema: z.ZodType<Prisma.TelegramMessageSessionCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TelegramMessageSessionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TelegramMessageSessionAvgOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TelegramMessageSessionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TelegramMessageSessionMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TelegramMessageSessionMinOrderByAggregateInputSchema: z.ZodType<Prisma.TelegramMessageSessionMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TelegramMessageSessionSumOrderByAggregateInputSchema: z.ZodType<Prisma.TelegramMessageSessionSumOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const ExchangeCredentialCountOrderByAggregateInputSchema: z.ZodType<Prisma.ExchangeCredentialCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  exchangeId: z.lazy(() => SortOrderSchema).optional(),
  apiKeyEnc: z.lazy(() => SortOrderSchema).optional(),
  apiSecretEnc: z.lazy(() => SortOrderSchema).optional(),
  passphraseEnc: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ExchangeCredentialMaxOrderByAggregateInputSchema: z.ZodType<Prisma.ExchangeCredentialMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  exchangeId: z.lazy(() => SortOrderSchema).optional(),
  apiKeyEnc: z.lazy(() => SortOrderSchema).optional(),
  apiSecretEnc: z.lazy(() => SortOrderSchema).optional(),
  passphraseEnc: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const ExchangeCredentialMinOrderByAggregateInputSchema: z.ZodType<Prisma.ExchangeCredentialMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  exchangeId: z.lazy(() => SortOrderSchema).optional(),
  apiKeyEnc: z.lazy(() => SortOrderSchema).optional(),
  apiSecretEnc: z.lazy(() => SortOrderSchema).optional(),
  passphraseEnc: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const TradingPairCountOrderByAggregateInputSchema: z.ZodType<Prisma.TradingPairCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  symbol: z.lazy(() => SortOrderSchema).optional(),
  base: z.lazy(() => SortOrderSchema).optional(),
  quote: z.lazy(() => SortOrderSchema).optional(),
  isLinear: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  notes: z.lazy(() => SortOrderSchema).optional(),
  addedByTg: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TradingPairMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TradingPairMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  symbol: z.lazy(() => SortOrderSchema).optional(),
  base: z.lazy(() => SortOrderSchema).optional(),
  quote: z.lazy(() => SortOrderSchema).optional(),
  isLinear: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  notes: z.lazy(() => SortOrderSchema).optional(),
  addedByTg: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TradingPairMinOrderByAggregateInputSchema: z.ZodType<Prisma.TradingPairMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  symbol: z.lazy(() => SortOrderSchema).optional(),
  base: z.lazy(() => SortOrderSchema).optional(),
  quote: z.lazy(() => SortOrderSchema).optional(),
  isLinear: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  notes: z.lazy(() => SortOrderSchema).optional(),
  addedByTg: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NotificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  level: z.lazy(() => SortOrderSchema).optional(),
  channel: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  target: z.lazy(() => SortOrderSchema).optional(),
  meta: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error: z.lazy(() => SortOrderSchema).optional(),
  sentAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const NotificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  level: z.lazy(() => SortOrderSchema).optional(),
  channel: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  target: z.lazy(() => SortOrderSchema).optional(),
  meta: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error: z.lazy(() => SortOrderSchema).optional(),
  sentAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const NotificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.NotificationMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  level: z.lazy(() => SortOrderSchema).optional(),
  channel: z.lazy(() => SortOrderSchema).optional(),
  title: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  target: z.lazy(() => SortOrderSchema).optional(),
  meta: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  error: z.lazy(() => SortOrderSchema).optional(),
  sentAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
}).strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional().nullable()
}).strict();

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional()
}).strict();

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.object({
  set: z.boolean().optional()
}).strict();

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional().nullable()
}).strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(),UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(),
  having: UserScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const TelegramMessageSessionFindFirstArgsSchema: z.ZodType<Prisma.TelegramMessageSessionFindFirstArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  where: TelegramMessageSessionWhereInputSchema.optional(),
  orderBy: z.union([ TelegramMessageSessionOrderByWithRelationInputSchema.array(),TelegramMessageSessionOrderByWithRelationInputSchema ]).optional(),
  cursor: TelegramMessageSessionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TelegramMessageSessionScalarFieldEnumSchema,TelegramMessageSessionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TelegramMessageSessionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TelegramMessageSessionFindFirstOrThrowArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  where: TelegramMessageSessionWhereInputSchema.optional(),
  orderBy: z.union([ TelegramMessageSessionOrderByWithRelationInputSchema.array(),TelegramMessageSessionOrderByWithRelationInputSchema ]).optional(),
  cursor: TelegramMessageSessionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TelegramMessageSessionScalarFieldEnumSchema,TelegramMessageSessionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TelegramMessageSessionFindManyArgsSchema: z.ZodType<Prisma.TelegramMessageSessionFindManyArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  where: TelegramMessageSessionWhereInputSchema.optional(),
  orderBy: z.union([ TelegramMessageSessionOrderByWithRelationInputSchema.array(),TelegramMessageSessionOrderByWithRelationInputSchema ]).optional(),
  cursor: TelegramMessageSessionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TelegramMessageSessionScalarFieldEnumSchema,TelegramMessageSessionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TelegramMessageSessionAggregateArgsSchema: z.ZodType<Prisma.TelegramMessageSessionAggregateArgs> = z.object({
  where: TelegramMessageSessionWhereInputSchema.optional(),
  orderBy: z.union([ TelegramMessageSessionOrderByWithRelationInputSchema.array(),TelegramMessageSessionOrderByWithRelationInputSchema ]).optional(),
  cursor: TelegramMessageSessionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const TelegramMessageSessionGroupByArgsSchema: z.ZodType<Prisma.TelegramMessageSessionGroupByArgs> = z.object({
  where: TelegramMessageSessionWhereInputSchema.optional(),
  orderBy: z.union([ TelegramMessageSessionOrderByWithAggregationInputSchema.array(),TelegramMessageSessionOrderByWithAggregationInputSchema ]).optional(),
  by: TelegramMessageSessionScalarFieldEnumSchema.array(),
  having: TelegramMessageSessionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const TelegramMessageSessionFindUniqueArgsSchema: z.ZodType<Prisma.TelegramMessageSessionFindUniqueArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  where: TelegramMessageSessionWhereUniqueInputSchema,
}).strict() ;

export const TelegramMessageSessionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TelegramMessageSessionFindUniqueOrThrowArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  where: TelegramMessageSessionWhereUniqueInputSchema,
}).strict() ;

export const ExchangeCredentialFindFirstArgsSchema: z.ZodType<Prisma.ExchangeCredentialFindFirstArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  where: ExchangeCredentialWhereInputSchema.optional(),
  orderBy: z.union([ ExchangeCredentialOrderByWithRelationInputSchema.array(),ExchangeCredentialOrderByWithRelationInputSchema ]).optional(),
  cursor: ExchangeCredentialWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ExchangeCredentialScalarFieldEnumSchema,ExchangeCredentialScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ExchangeCredentialFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ExchangeCredentialFindFirstOrThrowArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  where: ExchangeCredentialWhereInputSchema.optional(),
  orderBy: z.union([ ExchangeCredentialOrderByWithRelationInputSchema.array(),ExchangeCredentialOrderByWithRelationInputSchema ]).optional(),
  cursor: ExchangeCredentialWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ExchangeCredentialScalarFieldEnumSchema,ExchangeCredentialScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ExchangeCredentialFindManyArgsSchema: z.ZodType<Prisma.ExchangeCredentialFindManyArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  where: ExchangeCredentialWhereInputSchema.optional(),
  orderBy: z.union([ ExchangeCredentialOrderByWithRelationInputSchema.array(),ExchangeCredentialOrderByWithRelationInputSchema ]).optional(),
  cursor: ExchangeCredentialWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ExchangeCredentialScalarFieldEnumSchema,ExchangeCredentialScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const ExchangeCredentialAggregateArgsSchema: z.ZodType<Prisma.ExchangeCredentialAggregateArgs> = z.object({
  where: ExchangeCredentialWhereInputSchema.optional(),
  orderBy: z.union([ ExchangeCredentialOrderByWithRelationInputSchema.array(),ExchangeCredentialOrderByWithRelationInputSchema ]).optional(),
  cursor: ExchangeCredentialWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ExchangeCredentialGroupByArgsSchema: z.ZodType<Prisma.ExchangeCredentialGroupByArgs> = z.object({
  where: ExchangeCredentialWhereInputSchema.optional(),
  orderBy: z.union([ ExchangeCredentialOrderByWithAggregationInputSchema.array(),ExchangeCredentialOrderByWithAggregationInputSchema ]).optional(),
  by: ExchangeCredentialScalarFieldEnumSchema.array(),
  having: ExchangeCredentialScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const ExchangeCredentialFindUniqueArgsSchema: z.ZodType<Prisma.ExchangeCredentialFindUniqueArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  where: ExchangeCredentialWhereUniqueInputSchema,
}).strict() ;

export const ExchangeCredentialFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.ExchangeCredentialFindUniqueOrThrowArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  where: ExchangeCredentialWhereUniqueInputSchema,
}).strict() ;

export const TradingPairFindFirstArgsSchema: z.ZodType<Prisma.TradingPairFindFirstArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  where: TradingPairWhereInputSchema.optional(),
  orderBy: z.union([ TradingPairOrderByWithRelationInputSchema.array(),TradingPairOrderByWithRelationInputSchema ]).optional(),
  cursor: TradingPairWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TradingPairScalarFieldEnumSchema,TradingPairScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TradingPairFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TradingPairFindFirstOrThrowArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  where: TradingPairWhereInputSchema.optional(),
  orderBy: z.union([ TradingPairOrderByWithRelationInputSchema.array(),TradingPairOrderByWithRelationInputSchema ]).optional(),
  cursor: TradingPairWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TradingPairScalarFieldEnumSchema,TradingPairScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TradingPairFindManyArgsSchema: z.ZodType<Prisma.TradingPairFindManyArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  where: TradingPairWhereInputSchema.optional(),
  orderBy: z.union([ TradingPairOrderByWithRelationInputSchema.array(),TradingPairOrderByWithRelationInputSchema ]).optional(),
  cursor: TradingPairWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TradingPairScalarFieldEnumSchema,TradingPairScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TradingPairAggregateArgsSchema: z.ZodType<Prisma.TradingPairAggregateArgs> = z.object({
  where: TradingPairWhereInputSchema.optional(),
  orderBy: z.union([ TradingPairOrderByWithRelationInputSchema.array(),TradingPairOrderByWithRelationInputSchema ]).optional(),
  cursor: TradingPairWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const TradingPairGroupByArgsSchema: z.ZodType<Prisma.TradingPairGroupByArgs> = z.object({
  where: TradingPairWhereInputSchema.optional(),
  orderBy: z.union([ TradingPairOrderByWithAggregationInputSchema.array(),TradingPairOrderByWithAggregationInputSchema ]).optional(),
  by: TradingPairScalarFieldEnumSchema.array(),
  having: TradingPairScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const TradingPairFindUniqueArgsSchema: z.ZodType<Prisma.TradingPairFindUniqueArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  where: TradingPairWhereUniqueInputSchema,
}).strict() ;

export const TradingPairFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TradingPairFindUniqueOrThrowArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  where: TradingPairWhereUniqueInputSchema,
}).strict() ;

export const NotificationFindFirstArgsSchema: z.ZodType<Prisma.NotificationFindFirstArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  where: NotificationWhereInputSchema.optional(),
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(),NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema,NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const NotificationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.NotificationFindFirstOrThrowArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  where: NotificationWhereInputSchema.optional(),
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(),NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema,NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const NotificationFindManyArgsSchema: z.ZodType<Prisma.NotificationFindManyArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  where: NotificationWhereInputSchema.optional(),
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(),NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ NotificationScalarFieldEnumSchema,NotificationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const NotificationAggregateArgsSchema: z.ZodType<Prisma.NotificationAggregateArgs> = z.object({
  where: NotificationWhereInputSchema.optional(),
  orderBy: z.union([ NotificationOrderByWithRelationInputSchema.array(),NotificationOrderByWithRelationInputSchema ]).optional(),
  cursor: NotificationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const NotificationGroupByArgsSchema: z.ZodType<Prisma.NotificationGroupByArgs> = z.object({
  where: NotificationWhereInputSchema.optional(),
  orderBy: z.union([ NotificationOrderByWithAggregationInputSchema.array(),NotificationOrderByWithAggregationInputSchema ]).optional(),
  by: NotificationScalarFieldEnumSchema.array(),
  having: NotificationScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const NotificationFindUniqueArgsSchema: z.ZodType<Prisma.NotificationFindUniqueArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  where: NotificationWhereUniqueInputSchema,
}).strict() ;

export const NotificationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.NotificationFindUniqueOrThrowArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  where: NotificationWhereUniqueInputSchema,
}).strict() ;

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  data: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
}).strict() ;

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereUniqueInputSchema,
  create: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
}).strict() ;

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
}).strict() ;

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
}).strict() ;

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  data: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
}).strict() ;

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(),
}).strict() ;

export const TelegramMessageSessionCreateArgsSchema: z.ZodType<Prisma.TelegramMessageSessionCreateArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  data: z.union([ TelegramMessageSessionCreateInputSchema,TelegramMessageSessionUncheckedCreateInputSchema ]),
}).strict() ;

export const TelegramMessageSessionUpsertArgsSchema: z.ZodType<Prisma.TelegramMessageSessionUpsertArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  where: TelegramMessageSessionWhereUniqueInputSchema,
  create: z.union([ TelegramMessageSessionCreateInputSchema,TelegramMessageSessionUncheckedCreateInputSchema ]),
  update: z.union([ TelegramMessageSessionUpdateInputSchema,TelegramMessageSessionUncheckedUpdateInputSchema ]),
}).strict() ;

export const TelegramMessageSessionCreateManyArgsSchema: z.ZodType<Prisma.TelegramMessageSessionCreateManyArgs> = z.object({
  data: z.union([ TelegramMessageSessionCreateManyInputSchema,TelegramMessageSessionCreateManyInputSchema.array() ]),
}).strict() ;

export const TelegramMessageSessionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TelegramMessageSessionCreateManyAndReturnArgs> = z.object({
  data: z.union([ TelegramMessageSessionCreateManyInputSchema,TelegramMessageSessionCreateManyInputSchema.array() ]),
}).strict() ;

export const TelegramMessageSessionDeleteArgsSchema: z.ZodType<Prisma.TelegramMessageSessionDeleteArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  where: TelegramMessageSessionWhereUniqueInputSchema,
}).strict() ;

export const TelegramMessageSessionUpdateArgsSchema: z.ZodType<Prisma.TelegramMessageSessionUpdateArgs> = z.object({
  select: TelegramMessageSessionSelectSchema.optional(),
  data: z.union([ TelegramMessageSessionUpdateInputSchema,TelegramMessageSessionUncheckedUpdateInputSchema ]),
  where: TelegramMessageSessionWhereUniqueInputSchema,
}).strict() ;

export const TelegramMessageSessionUpdateManyArgsSchema: z.ZodType<Prisma.TelegramMessageSessionUpdateManyArgs> = z.object({
  data: z.union([ TelegramMessageSessionUpdateManyMutationInputSchema,TelegramMessageSessionUncheckedUpdateManyInputSchema ]),
  where: TelegramMessageSessionWhereInputSchema.optional(),
}).strict() ;

export const TelegramMessageSessionDeleteManyArgsSchema: z.ZodType<Prisma.TelegramMessageSessionDeleteManyArgs> = z.object({
  where: TelegramMessageSessionWhereInputSchema.optional(),
}).strict() ;

export const ExchangeCredentialCreateArgsSchema: z.ZodType<Prisma.ExchangeCredentialCreateArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  data: z.union([ ExchangeCredentialCreateInputSchema,ExchangeCredentialUncheckedCreateInputSchema ]),
}).strict() ;

export const ExchangeCredentialUpsertArgsSchema: z.ZodType<Prisma.ExchangeCredentialUpsertArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  where: ExchangeCredentialWhereUniqueInputSchema,
  create: z.union([ ExchangeCredentialCreateInputSchema,ExchangeCredentialUncheckedCreateInputSchema ]),
  update: z.union([ ExchangeCredentialUpdateInputSchema,ExchangeCredentialUncheckedUpdateInputSchema ]),
}).strict() ;

export const ExchangeCredentialCreateManyArgsSchema: z.ZodType<Prisma.ExchangeCredentialCreateManyArgs> = z.object({
  data: z.union([ ExchangeCredentialCreateManyInputSchema,ExchangeCredentialCreateManyInputSchema.array() ]),
}).strict() ;

export const ExchangeCredentialCreateManyAndReturnArgsSchema: z.ZodType<Prisma.ExchangeCredentialCreateManyAndReturnArgs> = z.object({
  data: z.union([ ExchangeCredentialCreateManyInputSchema,ExchangeCredentialCreateManyInputSchema.array() ]),
}).strict() ;

export const ExchangeCredentialDeleteArgsSchema: z.ZodType<Prisma.ExchangeCredentialDeleteArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  where: ExchangeCredentialWhereUniqueInputSchema,
}).strict() ;

export const ExchangeCredentialUpdateArgsSchema: z.ZodType<Prisma.ExchangeCredentialUpdateArgs> = z.object({
  select: ExchangeCredentialSelectSchema.optional(),
  data: z.union([ ExchangeCredentialUpdateInputSchema,ExchangeCredentialUncheckedUpdateInputSchema ]),
  where: ExchangeCredentialWhereUniqueInputSchema,
}).strict() ;

export const ExchangeCredentialUpdateManyArgsSchema: z.ZodType<Prisma.ExchangeCredentialUpdateManyArgs> = z.object({
  data: z.union([ ExchangeCredentialUpdateManyMutationInputSchema,ExchangeCredentialUncheckedUpdateManyInputSchema ]),
  where: ExchangeCredentialWhereInputSchema.optional(),
}).strict() ;

export const ExchangeCredentialDeleteManyArgsSchema: z.ZodType<Prisma.ExchangeCredentialDeleteManyArgs> = z.object({
  where: ExchangeCredentialWhereInputSchema.optional(),
}).strict() ;

export const TradingPairCreateArgsSchema: z.ZodType<Prisma.TradingPairCreateArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  data: z.union([ TradingPairCreateInputSchema,TradingPairUncheckedCreateInputSchema ]),
}).strict() ;

export const TradingPairUpsertArgsSchema: z.ZodType<Prisma.TradingPairUpsertArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  where: TradingPairWhereUniqueInputSchema,
  create: z.union([ TradingPairCreateInputSchema,TradingPairUncheckedCreateInputSchema ]),
  update: z.union([ TradingPairUpdateInputSchema,TradingPairUncheckedUpdateInputSchema ]),
}).strict() ;

export const TradingPairCreateManyArgsSchema: z.ZodType<Prisma.TradingPairCreateManyArgs> = z.object({
  data: z.union([ TradingPairCreateManyInputSchema,TradingPairCreateManyInputSchema.array() ]),
}).strict() ;

export const TradingPairCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TradingPairCreateManyAndReturnArgs> = z.object({
  data: z.union([ TradingPairCreateManyInputSchema,TradingPairCreateManyInputSchema.array() ]),
}).strict() ;

export const TradingPairDeleteArgsSchema: z.ZodType<Prisma.TradingPairDeleteArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  where: TradingPairWhereUniqueInputSchema,
}).strict() ;

export const TradingPairUpdateArgsSchema: z.ZodType<Prisma.TradingPairUpdateArgs> = z.object({
  select: TradingPairSelectSchema.optional(),
  data: z.union([ TradingPairUpdateInputSchema,TradingPairUncheckedUpdateInputSchema ]),
  where: TradingPairWhereUniqueInputSchema,
}).strict() ;

export const TradingPairUpdateManyArgsSchema: z.ZodType<Prisma.TradingPairUpdateManyArgs> = z.object({
  data: z.union([ TradingPairUpdateManyMutationInputSchema,TradingPairUncheckedUpdateManyInputSchema ]),
  where: TradingPairWhereInputSchema.optional(),
}).strict() ;

export const TradingPairDeleteManyArgsSchema: z.ZodType<Prisma.TradingPairDeleteManyArgs> = z.object({
  where: TradingPairWhereInputSchema.optional(),
}).strict() ;

export const NotificationCreateArgsSchema: z.ZodType<Prisma.NotificationCreateArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  data: z.union([ NotificationCreateInputSchema,NotificationUncheckedCreateInputSchema ]),
}).strict() ;

export const NotificationUpsertArgsSchema: z.ZodType<Prisma.NotificationUpsertArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  where: NotificationWhereUniqueInputSchema,
  create: z.union([ NotificationCreateInputSchema,NotificationUncheckedCreateInputSchema ]),
  update: z.union([ NotificationUpdateInputSchema,NotificationUncheckedUpdateInputSchema ]),
}).strict() ;

export const NotificationCreateManyArgsSchema: z.ZodType<Prisma.NotificationCreateManyArgs> = z.object({
  data: z.union([ NotificationCreateManyInputSchema,NotificationCreateManyInputSchema.array() ]),
}).strict() ;

export const NotificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.NotificationCreateManyAndReturnArgs> = z.object({
  data: z.union([ NotificationCreateManyInputSchema,NotificationCreateManyInputSchema.array() ]),
}).strict() ;

export const NotificationDeleteArgsSchema: z.ZodType<Prisma.NotificationDeleteArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  where: NotificationWhereUniqueInputSchema,
}).strict() ;

export const NotificationUpdateArgsSchema: z.ZodType<Prisma.NotificationUpdateArgs> = z.object({
  select: NotificationSelectSchema.optional(),
  data: z.union([ NotificationUpdateInputSchema,NotificationUncheckedUpdateInputSchema ]),
  where: NotificationWhereUniqueInputSchema,
}).strict() ;

export const NotificationUpdateManyArgsSchema: z.ZodType<Prisma.NotificationUpdateManyArgs> = z.object({
  data: z.union([ NotificationUpdateManyMutationInputSchema,NotificationUncheckedUpdateManyInputSchema ]),
  where: NotificationWhereInputSchema.optional(),
}).strict() ;

export const NotificationDeleteManyArgsSchema: z.ZodType<Prisma.NotificationDeleteManyArgs> = z.object({
  where: NotificationWhereInputSchema.optional(),
}).strict() ;