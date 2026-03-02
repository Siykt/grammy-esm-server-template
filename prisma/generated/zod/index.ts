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

export const TradeScalarFieldEnumSchema = z.enum(['id','orderId','marketId','tokenId','side','price','size','fee','status','outcome','strategyName','transactionHash','executedAt','createdAt']);

export const PositionScalarFieldEnumSchema = z.enum(['id','marketId','tokenId','side','size','avgEntryPrice','currentPrice','unrealizedPnL','realizedPnL','stopLoss','takeProfit','updatedAt','createdAt']);

export const StrategyConfigScalarFieldEnumSchema = z.enum(['id','name','enabled','params','lastRunAt','updatedAt','createdAt']);

export const RiskConfigScalarFieldEnumSchema = z.enum(['id','name','maxPositionSize','maxTotalExposure','maxDrawdown','stopLossPercent','takeProfitPercent','minArbitrageProfit','kellyFraction','updatedAt','createdAt']);

export const OpportunityLogScalarFieldEnumSchema = z.enum(['id','type','marketIds','expectedProfit','expectedProfitPercent','confidence','status','strategyName','metadata','actualProfit','expiresAt','executedAt','createdAt']);

export const WeatherForecastScalarFieldEnumSchema = z.enum(['id','station','date','highF','lowF','leadDays','narrative','precipChanceDay','precipChanceNight','qpf','fetchedAt']);

export const WeatherObservationScalarFieldEnumSchema = z.enum(['id','station','date','highF','lowF','precip','weather','fetchedAt']);

export const DailyPerformanceScalarFieldEnumSchema = z.enum(['id','date','realizedPnL','tradesCount','winCount','lossCount','volume','fees','opportunitiesFound','opportunitiesExecuted','createdAt','updatedAt']);

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
// TRADE SCHEMA
/////////////////////////////////////////

/**
 * Trade record
 */
export const TradeSchema = z.object({
  id: z.string(),
  /**
   * External order ID from Polymarket
   */
  orderId: z.string(),
  /**
   * Market condition ID
   */
  marketId: z.string(),
  /**
   * Token ID
   */
  tokenId: z.string(),
  /**
   * Trade side: BUY or SELL
   */
  side: z.string(),
  /**
   * Trade price (0-1)
   */
  price: z.number(),
  /**
   * Trade size (shares)
   */
  size: z.number(),
  /**
   * Fee amount
   */
  fee: z.number(),
  /**
   * Trade status
   */
  status: z.string(),
  /**
   * Outcome name (Yes/No)
   */
  outcome: z.string().nullable(),
  /**
   * Strategy that executed this trade
   */
  strategyName: z.string().nullable(),
  /**
   * Transaction hash
   */
  transactionHash: z.string().nullable(),
  /**
   * When the trade was executed
   */
  executedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type Trade = z.infer<typeof TradeSchema>

/////////////////////////////////////////
// POSITION SCHEMA
/////////////////////////////////////////

/**
 * Position tracking
 */
export const PositionSchema = z.object({
  id: z.string(),
  /**
   * Market condition ID
   */
  marketId: z.string(),
  /**
   * Token ID
   */
  tokenId: z.string(),
  /**
   * Position side: BUY (long) or SELL (short)
   */
  side: z.string(),
  /**
   * Current position size
   */
  size: z.number(),
  /**
   * Average entry price
   */
  avgEntryPrice: z.number(),
  /**
   * Current market price
   */
  currentPrice: z.number(),
  /**
   * Unrealized PnL
   */
  unrealizedPnL: z.number(),
  /**
   * Realized PnL from closed portions
   */
  realizedPnL: z.number(),
  /**
   * Stop-loss price (optional)
   */
  stopLoss: z.number().nullable(),
  /**
   * Take-profit price (optional)
   */
  takeProfit: z.number().nullable(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type Position = z.infer<typeof PositionSchema>

/////////////////////////////////////////
// STRATEGY CONFIG SCHEMA
/////////////////////////////////////////

/**
 * Strategy configuration
 */
export const StrategyConfigSchema = z.object({
  id: z.string(),
  /**
   * Strategy name (unique identifier)
   */
  name: z.string(),
  /**
   * Whether strategy is enabled
   */
  enabled: z.boolean(),
  /**
   * Strategy parameters as JSON
   */
  params: z.string(),
  /**
   * Last execution time
   */
  lastRunAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type StrategyConfig = z.infer<typeof StrategyConfigSchema>

/////////////////////////////////////////
// RISK CONFIG SCHEMA
/////////////////////////////////////////

/**
 * Risk configuration
 */
export const RiskConfigSchema = z.object({
  id: z.string(),
  /**
   * Configuration name
   */
  name: z.string(),
  /**
   * Maximum position size per market (USDC)
   */
  maxPositionSize: z.number(),
  /**
   * Maximum total exposure (USDC)
   */
  maxTotalExposure: z.number(),
  /**
   * Maximum drawdown percentage before stopping
   */
  maxDrawdown: z.number(),
  /**
   * Default stop-loss percentage
   */
  stopLossPercent: z.number(),
  /**
   * Default take-profit percentage
   */
  takeProfitPercent: z.number(),
  /**
   * Minimum profit threshold for arbitrage (USDC)
   */
  minArbitrageProfit: z.number(),
  /**
   * Kelly fraction multiplier (0.5 = half Kelly)
   */
  kellyFraction: z.number(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
})

export type RiskConfig = z.infer<typeof RiskConfigSchema>

/////////////////////////////////////////
// OPPORTUNITY LOG SCHEMA
/////////////////////////////////////////

/**
 * Opportunity log
 */
export const OpportunityLogSchema = z.object({
  id: z.string(),
  /**
   * Opportunity type: cross-market, event-arbitrage, deviation
   */
  type: z.string(),
  /**
   * Related market IDs (JSON array)
   */
  marketIds: z.string(),
  /**
   * Expected profit amount
   */
  expectedProfit: z.number(),
  /**
   * Expected profit percentage
   */
  expectedProfitPercent: z.number(),
  /**
   * Confidence score (0-1)
   */
  confidence: z.number(),
  /**
   * Status: pending, executing, executed, expired, skipped, failed
   */
  status: z.string(),
  /**
   * Strategy that found this opportunity
   */
  strategyName: z.string(),
  /**
   * Additional metadata as JSON
   */
  metadata: z.string(),
  /**
   * Actual profit after execution (if executed)
   */
  actualProfit: z.number().nullable(),
  /**
   * Expiration time
   */
  expiresAt: z.coerce.date(),
  /**
   * Execution time (if executed)
   */
  executedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})

export type OpportunityLog = z.infer<typeof OpportunityLogSchema>

/////////////////////////////////////////
// WEATHER FORECAST SCHEMA
/////////////////////////////////////////

/**
 * WU 天气预报快照
 * 每次抓取时记录预报值，同一日期可有多条（不同抓取时间），用于回溯预报准确率
 */
export const WeatherForecastSchema = z.object({
  id: z.string(),
  /**
   * 站点 ICAO 代码（如 KLGA）
   */
  station: z.string(),
  /**
   * 预报目标日期 YYYY-MM-DD
   */
  date: z.string(),
  /**
   * 预报最高温 (°F)
   */
  highF: z.number().int(),
  /**
   * 预报最低温 (°F)
   */
  lowF: z.number().int(),
  /**
   * 抓取时距目标日期的天数（0=当天，1=提前1天...）
   */
  leadDays: z.number().int(),
  /**
   * 叙述描述
   */
  narrative: z.string(),
  /**
   * 降水概率（白天 %）
   */
  precipChanceDay: z.number().int().nullable(),
  /**
   * 降水概率（夜间 %）
   */
  precipChanceNight: z.number().int().nullable(),
  /**
   * 降水量 (英寸)
   */
  qpf: z.number(),
  /**
   * 抓取时间
   */
  fetchedAt: z.coerce.date(),
})

export type WeatherForecast = z.infer<typeof WeatherForecastSchema>

/////////////////////////////////////////
// WEATHER OBSERVATION SCHEMA
/////////////////////////////////////////

/**
 * WU 实际天气观测
 * 每天一条，记录结算用的实际温度
 */
export const WeatherObservationSchema = z.object({
  id: z.string(),
  /**
   * 站点 ICAO 代码
   */
  station: z.string(),
  /**
   * 观测日期 YYYY-MM-DD
   */
  date: z.string(),
  /**
   * 实际最高温 (°F)，当天数据未完整时可能为 null
   */
  highF: z.number().int().nullable(),
  /**
   * 实际最低温 (°F)，当天数据未完整时可能为 null
   */
  lowF: z.number().int().nullable(),
  /**
   * 降水量 (英寸)
   */
  precip: z.number(),
  /**
   * 天气描述
   */
  weather: z.string(),
  /**
   * 抓取时间
   */
  fetchedAt: z.coerce.date(),
})

export type WeatherObservation = z.infer<typeof WeatherObservationSchema>

/////////////////////////////////////////
// DAILY PERFORMANCE SCHEMA
/////////////////////////////////////////

/**
 * Daily performance summary
 */
export const DailyPerformanceSchema = z.object({
  id: z.string(),
  /**
   * Date (YYYY-MM-DD format)
   */
  date: z.string(),
  /**
   * Total realized PnL for the day
   */
  realizedPnL: z.number(),
  /**
   * Total trades executed
   */
  tradesCount: z.number().int(),
  /**
   * Winning trades count
   */
  winCount: z.number().int(),
  /**
   * Losing trades count
   */
  lossCount: z.number().int(),
  /**
   * Total volume traded (USDC)
   */
  volume: z.number(),
  /**
   * Total fees paid
   */
  fees: z.number(),
  /**
   * Opportunities found
   */
  opportunitiesFound: z.number().int(),
  /**
   * Opportunities executed
   */
  opportunitiesExecuted: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type DailyPerformance = z.infer<typeof DailyPerformanceSchema>

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

// TRADE
//------------------------------------------------------

export const TradeSelectSchema: z.ZodType<Prisma.TradeSelect> = z.object({
  id: z.boolean().optional(),
  orderId: z.boolean().optional(),
  marketId: z.boolean().optional(),
  tokenId: z.boolean().optional(),
  side: z.boolean().optional(),
  price: z.boolean().optional(),
  size: z.boolean().optional(),
  fee: z.boolean().optional(),
  status: z.boolean().optional(),
  outcome: z.boolean().optional(),
  strategyName: z.boolean().optional(),
  transactionHash: z.boolean().optional(),
  executedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

// POSITION
//------------------------------------------------------

export const PositionSelectSchema: z.ZodType<Prisma.PositionSelect> = z.object({
  id: z.boolean().optional(),
  marketId: z.boolean().optional(),
  tokenId: z.boolean().optional(),
  side: z.boolean().optional(),
  size: z.boolean().optional(),
  avgEntryPrice: z.boolean().optional(),
  currentPrice: z.boolean().optional(),
  unrealizedPnL: z.boolean().optional(),
  realizedPnL: z.boolean().optional(),
  stopLoss: z.boolean().optional(),
  takeProfit: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

// STRATEGY CONFIG
//------------------------------------------------------

export const StrategyConfigSelectSchema: z.ZodType<Prisma.StrategyConfigSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  enabled: z.boolean().optional(),
  params: z.boolean().optional(),
  lastRunAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

// RISK CONFIG
//------------------------------------------------------

export const RiskConfigSelectSchema: z.ZodType<Prisma.RiskConfigSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  maxPositionSize: z.boolean().optional(),
  maxTotalExposure: z.boolean().optional(),
  maxDrawdown: z.boolean().optional(),
  stopLossPercent: z.boolean().optional(),
  takeProfitPercent: z.boolean().optional(),
  minArbitrageProfit: z.boolean().optional(),
  kellyFraction: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

// OPPORTUNITY LOG
//------------------------------------------------------

export const OpportunityLogSelectSchema: z.ZodType<Prisma.OpportunityLogSelect> = z.object({
  id: z.boolean().optional(),
  type: z.boolean().optional(),
  marketIds: z.boolean().optional(),
  expectedProfit: z.boolean().optional(),
  expectedProfitPercent: z.boolean().optional(),
  confidence: z.boolean().optional(),
  status: z.boolean().optional(),
  strategyName: z.boolean().optional(),
  metadata: z.boolean().optional(),
  actualProfit: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  executedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
}).strict()

// WEATHER FORECAST
//------------------------------------------------------

export const WeatherForecastSelectSchema: z.ZodType<Prisma.WeatherForecastSelect> = z.object({
  id: z.boolean().optional(),
  station: z.boolean().optional(),
  date: z.boolean().optional(),
  highF: z.boolean().optional(),
  lowF: z.boolean().optional(),
  leadDays: z.boolean().optional(),
  narrative: z.boolean().optional(),
  precipChanceDay: z.boolean().optional(),
  precipChanceNight: z.boolean().optional(),
  qpf: z.boolean().optional(),
  fetchedAt: z.boolean().optional(),
}).strict()

// WEATHER OBSERVATION
//------------------------------------------------------

export const WeatherObservationSelectSchema: z.ZodType<Prisma.WeatherObservationSelect> = z.object({
  id: z.boolean().optional(),
  station: z.boolean().optional(),
  date: z.boolean().optional(),
  highF: z.boolean().optional(),
  lowF: z.boolean().optional(),
  precip: z.boolean().optional(),
  weather: z.boolean().optional(),
  fetchedAt: z.boolean().optional(),
}).strict()

// DAILY PERFORMANCE
//------------------------------------------------------

export const DailyPerformanceSelectSchema: z.ZodType<Prisma.DailyPerformanceSelect> = z.object({
  id: z.boolean().optional(),
  date: z.boolean().optional(),
  realizedPnL: z.boolean().optional(),
  tradesCount: z.boolean().optional(),
  winCount: z.boolean().optional(),
  lossCount: z.boolean().optional(),
  volume: z.boolean().optional(),
  fees: z.boolean().optional(),
  opportunitiesFound: z.boolean().optional(),
  opportunitiesExecuted: z.boolean().optional(),
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

export const TradeWhereInputSchema: z.ZodType<Prisma.TradeWhereInput> = z.object({
  AND: z.union([ z.lazy(() => TradeWhereInputSchema),z.lazy(() => TradeWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TradeWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TradeWhereInputSchema),z.lazy(() => TradeWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  orderId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  marketId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  tokenId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  side: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  size: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fee: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  outcome: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  strategyName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  transactionHash: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  executedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const TradeOrderByWithRelationInputSchema: z.ZodType<Prisma.TradeOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  fee: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  outcome: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  strategyName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  transactionHash: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TradeWhereUniqueInputSchema: z.ZodType<Prisma.TradeWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => TradeWhereInputSchema),z.lazy(() => TradeWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => TradeWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TradeWhereInputSchema),z.lazy(() => TradeWhereInputSchema).array() ]).optional(),
  orderId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  marketId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  tokenId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  side: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  size: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fee: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  outcome: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  strategyName: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  transactionHash: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  executedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const TradeOrderByWithAggregationInputSchema: z.ZodType<Prisma.TradeOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  fee: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  outcome: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  strategyName: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  transactionHash: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => TradeCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => TradeAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => TradeMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => TradeMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => TradeSumOrderByAggregateInputSchema).optional()
}).strict();

export const TradeScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TradeScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => TradeScalarWhereWithAggregatesInputSchema),z.lazy(() => TradeScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => TradeScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => TradeScalarWhereWithAggregatesInputSchema),z.lazy(() => TradeScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  orderId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  marketId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  tokenId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  side: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  price: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  size: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  fee: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  outcome: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  strategyName: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  transactionHash: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  executedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const PositionWhereInputSchema: z.ZodType<Prisma.PositionWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PositionWhereInputSchema),z.lazy(() => PositionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PositionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PositionWhereInputSchema),z.lazy(() => PositionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  marketId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  tokenId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  side: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  size: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  avgEntryPrice: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  currentPrice: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  unrealizedPnL: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  realizedPnL: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  stopLoss: z.union([ z.lazy(() => FloatNullableFilterSchema),z.number() ]).optional().nullable(),
  takeProfit: z.union([ z.lazy(() => FloatNullableFilterSchema),z.number() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const PositionOrderByWithRelationInputSchema: z.ZodType<Prisma.PositionOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  avgEntryPrice: z.lazy(() => SortOrderSchema).optional(),
  currentPrice: z.lazy(() => SortOrderSchema).optional(),
  unrealizedPnL: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  stopLoss: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  takeProfit: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PositionWhereUniqueInputSchema: z.ZodType<Prisma.PositionWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    marketId: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    marketId: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  marketId: z.string().optional(),
  AND: z.union([ z.lazy(() => PositionWhereInputSchema),z.lazy(() => PositionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PositionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PositionWhereInputSchema),z.lazy(() => PositionWhereInputSchema).array() ]).optional(),
  tokenId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  side: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  size: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  avgEntryPrice: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  currentPrice: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  unrealizedPnL: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  realizedPnL: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  stopLoss: z.union([ z.lazy(() => FloatNullableFilterSchema),z.number() ]).optional().nullable(),
  takeProfit: z.union([ z.lazy(() => FloatNullableFilterSchema),z.number() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const PositionOrderByWithAggregationInputSchema: z.ZodType<Prisma.PositionOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  avgEntryPrice: z.lazy(() => SortOrderSchema).optional(),
  currentPrice: z.lazy(() => SortOrderSchema).optional(),
  unrealizedPnL: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  stopLoss: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  takeProfit: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PositionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PositionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PositionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PositionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PositionSumOrderByAggregateInputSchema).optional()
}).strict();

export const PositionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PositionScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => PositionScalarWhereWithAggregatesInputSchema),z.lazy(() => PositionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PositionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PositionScalarWhereWithAggregatesInputSchema),z.lazy(() => PositionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  marketId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  tokenId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  side: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  size: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  avgEntryPrice: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  currentPrice: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  unrealizedPnL: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  realizedPnL: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  stopLoss: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  takeProfit: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const StrategyConfigWhereInputSchema: z.ZodType<Prisma.StrategyConfigWhereInput> = z.object({
  AND: z.union([ z.lazy(() => StrategyConfigWhereInputSchema),z.lazy(() => StrategyConfigWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StrategyConfigWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StrategyConfigWhereInputSchema),z.lazy(() => StrategyConfigWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  params: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lastRunAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const StrategyConfigOrderByWithRelationInputSchema: z.ZodType<Prisma.StrategyConfigOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  params: z.lazy(() => SortOrderSchema).optional(),
  lastRunAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StrategyConfigWhereUniqueInputSchema: z.ZodType<Prisma.StrategyConfigWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    name: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    name: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  AND: z.union([ z.lazy(() => StrategyConfigWhereInputSchema),z.lazy(() => StrategyConfigWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => StrategyConfigWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StrategyConfigWhereInputSchema),z.lazy(() => StrategyConfigWhereInputSchema).array() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  params: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  lastRunAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const StrategyConfigOrderByWithAggregationInputSchema: z.ZodType<Prisma.StrategyConfigOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  params: z.lazy(() => SortOrderSchema).optional(),
  lastRunAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => StrategyConfigCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => StrategyConfigMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => StrategyConfigMinOrderByAggregateInputSchema).optional()
}).strict();

export const StrategyConfigScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.StrategyConfigScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => StrategyConfigScalarWhereWithAggregatesInputSchema),z.lazy(() => StrategyConfigScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => StrategyConfigScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => StrategyConfigScalarWhereWithAggregatesInputSchema),z.lazy(() => StrategyConfigScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  enabled: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  params: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  lastRunAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const RiskConfigWhereInputSchema: z.ZodType<Prisma.RiskConfigWhereInput> = z.object({
  AND: z.union([ z.lazy(() => RiskConfigWhereInputSchema),z.lazy(() => RiskConfigWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RiskConfigWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RiskConfigWhereInputSchema),z.lazy(() => RiskConfigWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  maxPositionSize: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  maxTotalExposure: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  maxDrawdown: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  stopLossPercent: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  takeProfitPercent: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  minArbitrageProfit: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  kellyFraction: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const RiskConfigOrderByWithRelationInputSchema: z.ZodType<Prisma.RiskConfigOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  maxPositionSize: z.lazy(() => SortOrderSchema).optional(),
  maxTotalExposure: z.lazy(() => SortOrderSchema).optional(),
  maxDrawdown: z.lazy(() => SortOrderSchema).optional(),
  stopLossPercent: z.lazy(() => SortOrderSchema).optional(),
  takeProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  minArbitrageProfit: z.lazy(() => SortOrderSchema).optional(),
  kellyFraction: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RiskConfigWhereUniqueInputSchema: z.ZodType<Prisma.RiskConfigWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    name: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    name: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  AND: z.union([ z.lazy(() => RiskConfigWhereInputSchema),z.lazy(() => RiskConfigWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => RiskConfigWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RiskConfigWhereInputSchema),z.lazy(() => RiskConfigWhereInputSchema).array() ]).optional(),
  maxPositionSize: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  maxTotalExposure: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  maxDrawdown: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  stopLossPercent: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  takeProfitPercent: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  minArbitrageProfit: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  kellyFraction: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const RiskConfigOrderByWithAggregationInputSchema: z.ZodType<Prisma.RiskConfigOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  maxPositionSize: z.lazy(() => SortOrderSchema).optional(),
  maxTotalExposure: z.lazy(() => SortOrderSchema).optional(),
  maxDrawdown: z.lazy(() => SortOrderSchema).optional(),
  stopLossPercent: z.lazy(() => SortOrderSchema).optional(),
  takeProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  minArbitrageProfit: z.lazy(() => SortOrderSchema).optional(),
  kellyFraction: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => RiskConfigCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => RiskConfigAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => RiskConfigMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => RiskConfigMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => RiskConfigSumOrderByAggregateInputSchema).optional()
}).strict();

export const RiskConfigScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RiskConfigScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => RiskConfigScalarWhereWithAggregatesInputSchema),z.lazy(() => RiskConfigScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => RiskConfigScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => RiskConfigScalarWhereWithAggregatesInputSchema),z.lazy(() => RiskConfigScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  maxPositionSize: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  maxTotalExposure: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  maxDrawdown: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  stopLossPercent: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  takeProfitPercent: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  minArbitrageProfit: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  kellyFraction: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const OpportunityLogWhereInputSchema: z.ZodType<Prisma.OpportunityLogWhereInput> = z.object({
  AND: z.union([ z.lazy(() => OpportunityLogWhereInputSchema),z.lazy(() => OpportunityLogWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OpportunityLogWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OpportunityLogWhereInputSchema),z.lazy(() => OpportunityLogWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  marketIds: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  expectedProfit: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  expectedProfitPercent: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  confidence: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  strategyName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  metadata: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  actualProfit: z.union([ z.lazy(() => FloatNullableFilterSchema),z.number() ]).optional().nullable(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  executedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const OpportunityLogOrderByWithRelationInputSchema: z.ZodType<Prisma.OpportunityLogOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  marketIds: z.lazy(() => SortOrderSchema).optional(),
  expectedProfit: z.lazy(() => SortOrderSchema).optional(),
  expectedProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  confidence: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  strategyName: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.lazy(() => SortOrderSchema).optional(),
  actualProfit: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OpportunityLogWhereUniqueInputSchema: z.ZodType<Prisma.OpportunityLogWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => OpportunityLogWhereInputSchema),z.lazy(() => OpportunityLogWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OpportunityLogWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OpportunityLogWhereInputSchema),z.lazy(() => OpportunityLogWhereInputSchema).array() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  marketIds: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  expectedProfit: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  expectedProfitPercent: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  confidence: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  strategyName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  metadata: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  actualProfit: z.union([ z.lazy(() => FloatNullableFilterSchema),z.number() ]).optional().nullable(),
  expiresAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  executedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const OpportunityLogOrderByWithAggregationInputSchema: z.ZodType<Prisma.OpportunityLogOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  marketIds: z.lazy(() => SortOrderSchema).optional(),
  expectedProfit: z.lazy(() => SortOrderSchema).optional(),
  expectedProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  confidence: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  strategyName: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.lazy(() => SortOrderSchema).optional(),
  actualProfit: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => OpportunityLogCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => OpportunityLogAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OpportunityLogMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OpportunityLogMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => OpportunityLogSumOrderByAggregateInputSchema).optional()
}).strict();

export const OpportunityLogScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OpportunityLogScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => OpportunityLogScalarWhereWithAggregatesInputSchema),z.lazy(() => OpportunityLogScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OpportunityLogScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OpportunityLogScalarWhereWithAggregatesInputSchema),z.lazy(() => OpportunityLogScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  type: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  marketIds: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  expectedProfit: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  expectedProfitPercent: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  confidence: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  strategyName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  metadata: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  actualProfit: z.union([ z.lazy(() => FloatNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  expiresAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  executedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const WeatherForecastWhereInputSchema: z.ZodType<Prisma.WeatherForecastWhereInput> = z.object({
  AND: z.union([ z.lazy(() => WeatherForecastWhereInputSchema),z.lazy(() => WeatherForecastWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WeatherForecastWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WeatherForecastWhereInputSchema),z.lazy(() => WeatherForecastWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  station: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  highF: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  lowF: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  leadDays: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  narrative: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  precipChanceDay: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  precipChanceNight: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  qpf: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const WeatherForecastOrderByWithRelationInputSchema: z.ZodType<Prisma.WeatherForecastOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  leadDays: z.lazy(() => SortOrderSchema).optional(),
  narrative: z.lazy(() => SortOrderSchema).optional(),
  precipChanceDay: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  precipChanceNight: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  qpf: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherForecastWhereUniqueInputSchema: z.ZodType<Prisma.WeatherForecastWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    station_date_fetchedAt: z.lazy(() => WeatherForecastStationDateFetchedAtCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    station_date_fetchedAt: z.lazy(() => WeatherForecastStationDateFetchedAtCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().optional(),
  station_date_fetchedAt: z.lazy(() => WeatherForecastStationDateFetchedAtCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => WeatherForecastWhereInputSchema),z.lazy(() => WeatherForecastWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WeatherForecastWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WeatherForecastWhereInputSchema),z.lazy(() => WeatherForecastWhereInputSchema).array() ]).optional(),
  station: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  highF: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  lowF: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  leadDays: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  narrative: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  precipChanceDay: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  precipChanceNight: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  qpf: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const WeatherForecastOrderByWithAggregationInputSchema: z.ZodType<Prisma.WeatherForecastOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  leadDays: z.lazy(() => SortOrderSchema).optional(),
  narrative: z.lazy(() => SortOrderSchema).optional(),
  precipChanceDay: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  precipChanceNight: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  qpf: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => WeatherForecastCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => WeatherForecastAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => WeatherForecastMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => WeatherForecastMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => WeatherForecastSumOrderByAggregateInputSchema).optional()
}).strict();

export const WeatherForecastScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.WeatherForecastScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => WeatherForecastScalarWhereWithAggregatesInputSchema),z.lazy(() => WeatherForecastScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => WeatherForecastScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WeatherForecastScalarWhereWithAggregatesInputSchema),z.lazy(() => WeatherForecastScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  station: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  highF: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  lowF: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  leadDays: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  narrative: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  precipChanceDay: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  precipChanceNight: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  qpf: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const WeatherObservationWhereInputSchema: z.ZodType<Prisma.WeatherObservationWhereInput> = z.object({
  AND: z.union([ z.lazy(() => WeatherObservationWhereInputSchema),z.lazy(() => WeatherObservationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WeatherObservationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WeatherObservationWhereInputSchema),z.lazy(() => WeatherObservationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  station: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  highF: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  lowF: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  precip: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  weather: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const WeatherObservationOrderByWithRelationInputSchema: z.ZodType<Prisma.WeatherObservationOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lowF: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  precip: z.lazy(() => SortOrderSchema).optional(),
  weather: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherObservationWhereUniqueInputSchema: z.ZodType<Prisma.WeatherObservationWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    station_date: z.lazy(() => WeatherObservationStationDateCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    station_date: z.lazy(() => WeatherObservationStationDateCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().optional(),
  station_date: z.lazy(() => WeatherObservationStationDateCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => WeatherObservationWhereInputSchema),z.lazy(() => WeatherObservationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => WeatherObservationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WeatherObservationWhereInputSchema),z.lazy(() => WeatherObservationWhereInputSchema).array() ]).optional(),
  station: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  highF: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  lowF: z.union([ z.lazy(() => IntNullableFilterSchema),z.number().int() ]).optional().nullable(),
  precip: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  weather: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const WeatherObservationOrderByWithAggregationInputSchema: z.ZodType<Prisma.WeatherObservationOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lowF: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  precip: z.lazy(() => SortOrderSchema).optional(),
  weather: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => WeatherObservationCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => WeatherObservationAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => WeatherObservationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => WeatherObservationMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => WeatherObservationSumOrderByAggregateInputSchema).optional()
}).strict();

export const WeatherObservationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.WeatherObservationScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => WeatherObservationScalarWhereWithAggregatesInputSchema),z.lazy(() => WeatherObservationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => WeatherObservationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => WeatherObservationScalarWhereWithAggregatesInputSchema),z.lazy(() => WeatherObservationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  station: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  highF: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  lowF: z.union([ z.lazy(() => IntNullableWithAggregatesFilterSchema),z.number() ]).optional().nullable(),
  precip: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  weather: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const DailyPerformanceWhereInputSchema: z.ZodType<Prisma.DailyPerformanceWhereInput> = z.object({
  AND: z.union([ z.lazy(() => DailyPerformanceWhereInputSchema),z.lazy(() => DailyPerformanceWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DailyPerformanceWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DailyPerformanceWhereInputSchema),z.lazy(() => DailyPerformanceWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  realizedPnL: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  tradesCount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  winCount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  lossCount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  volume: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fees: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  opportunitiesFound: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  opportunitiesExecuted: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const DailyPerformanceOrderByWithRelationInputSchema: z.ZodType<Prisma.DailyPerformanceOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  tradesCount: z.lazy(() => SortOrderSchema).optional(),
  winCount: z.lazy(() => SortOrderSchema).optional(),
  lossCount: z.lazy(() => SortOrderSchema).optional(),
  volume: z.lazy(() => SortOrderSchema).optional(),
  fees: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesFound: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesExecuted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyPerformanceWhereUniqueInputSchema: z.ZodType<Prisma.DailyPerformanceWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    date: z.string()
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    date: z.string(),
  }),
])
.and(z.object({
  id: z.string().optional(),
  date: z.string().optional(),
  AND: z.union([ z.lazy(() => DailyPerformanceWhereInputSchema),z.lazy(() => DailyPerformanceWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => DailyPerformanceWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DailyPerformanceWhereInputSchema),z.lazy(() => DailyPerformanceWhereInputSchema).array() ]).optional(),
  realizedPnL: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  tradesCount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  winCount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  lossCount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  volume: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  fees: z.union([ z.lazy(() => FloatFilterSchema),z.number() ]).optional(),
  opportunitiesFound: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  opportunitiesExecuted: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict());

export const DailyPerformanceOrderByWithAggregationInputSchema: z.ZodType<Prisma.DailyPerformanceOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  tradesCount: z.lazy(() => SortOrderSchema).optional(),
  winCount: z.lazy(() => SortOrderSchema).optional(),
  lossCount: z.lazy(() => SortOrderSchema).optional(),
  volume: z.lazy(() => SortOrderSchema).optional(),
  fees: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesFound: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesExecuted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => DailyPerformanceCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => DailyPerformanceAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => DailyPerformanceMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => DailyPerformanceMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => DailyPerformanceSumOrderByAggregateInputSchema).optional()
}).strict();

export const DailyPerformanceScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.DailyPerformanceScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => DailyPerformanceScalarWhereWithAggregatesInputSchema),z.lazy(() => DailyPerformanceScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => DailyPerformanceScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => DailyPerformanceScalarWhereWithAggregatesInputSchema),z.lazy(() => DailyPerformanceScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  date: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  realizedPnL: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  tradesCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  winCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  lossCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  volume: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  fees: z.union([ z.lazy(() => FloatWithAggregatesFilterSchema),z.number() ]).optional(),
  opportunitiesFound: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  opportunitiesExecuted: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
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

export const TradeCreateInputSchema: z.ZodType<Prisma.TradeCreateInput> = z.object({
  id: z.string().optional(),
  orderId: z.string(),
  marketId: z.string(),
  tokenId: z.string(),
  side: z.string(),
  price: z.number(),
  size: z.number(),
  fee: z.number().optional(),
  status: z.string(),
  outcome: z.string().optional().nullable(),
  strategyName: z.string().optional().nullable(),
  transactionHash: z.string().optional().nullable(),
  executedAt: z.coerce.date(),
  createdAt: z.coerce.date().optional()
}).strict();

export const TradeUncheckedCreateInputSchema: z.ZodType<Prisma.TradeUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  orderId: z.string(),
  marketId: z.string(),
  tokenId: z.string(),
  side: z.string(),
  price: z.number(),
  size: z.number(),
  fee: z.number().optional(),
  status: z.string(),
  outcome: z.string().optional().nullable(),
  strategyName: z.string().optional().nullable(),
  transactionHash: z.string().optional().nullable(),
  executedAt: z.coerce.date(),
  createdAt: z.coerce.date().optional()
}).strict();

export const TradeUpdateInputSchema: z.ZodType<Prisma.TradeUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  side: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fee: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outcome: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  strategyName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionHash: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TradeUncheckedUpdateInputSchema: z.ZodType<Prisma.TradeUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  side: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fee: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outcome: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  strategyName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionHash: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TradeCreateManyInputSchema: z.ZodType<Prisma.TradeCreateManyInput> = z.object({
  id: z.string().optional(),
  orderId: z.string(),
  marketId: z.string(),
  tokenId: z.string(),
  side: z.string(),
  price: z.number(),
  size: z.number(),
  fee: z.number().optional(),
  status: z.string(),
  outcome: z.string().optional().nullable(),
  strategyName: z.string().optional().nullable(),
  transactionHash: z.string().optional().nullable(),
  executedAt: z.coerce.date(),
  createdAt: z.coerce.date().optional()
}).strict();

export const TradeUpdateManyMutationInputSchema: z.ZodType<Prisma.TradeUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  side: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fee: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outcome: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  strategyName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionHash: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const TradeUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TradeUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  orderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  side: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  price: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fee: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  outcome: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  strategyName: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  transactionHash: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PositionCreateInputSchema: z.ZodType<Prisma.PositionCreateInput> = z.object({
  id: z.string().optional(),
  marketId: z.string(),
  tokenId: z.string(),
  side: z.string(),
  size: z.number(),
  avgEntryPrice: z.number(),
  currentPrice: z.number(),
  unrealizedPnL: z.number().optional(),
  realizedPnL: z.number().optional(),
  stopLoss: z.number().optional().nullable(),
  takeProfit: z.number().optional().nullable(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const PositionUncheckedCreateInputSchema: z.ZodType<Prisma.PositionUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  marketId: z.string(),
  tokenId: z.string(),
  side: z.string(),
  size: z.number(),
  avgEntryPrice: z.number(),
  currentPrice: z.number(),
  unrealizedPnL: z.number().optional(),
  realizedPnL: z.number().optional(),
  stopLoss: z.number().optional().nullable(),
  takeProfit: z.number().optional().nullable(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const PositionUpdateInputSchema: z.ZodType<Prisma.PositionUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  side: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  avgEntryPrice: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  currentPrice: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  unrealizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  realizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  stopLoss: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  takeProfit: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PositionUncheckedUpdateInputSchema: z.ZodType<Prisma.PositionUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  side: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  avgEntryPrice: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  currentPrice: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  unrealizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  realizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  stopLoss: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  takeProfit: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PositionCreateManyInputSchema: z.ZodType<Prisma.PositionCreateManyInput> = z.object({
  id: z.string().optional(),
  marketId: z.string(),
  tokenId: z.string(),
  side: z.string(),
  size: z.number(),
  avgEntryPrice: z.number(),
  currentPrice: z.number(),
  unrealizedPnL: z.number().optional(),
  realizedPnL: z.number().optional(),
  stopLoss: z.number().optional().nullable(),
  takeProfit: z.number().optional().nullable(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const PositionUpdateManyMutationInputSchema: z.ZodType<Prisma.PositionUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  side: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  avgEntryPrice: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  currentPrice: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  unrealizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  realizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  stopLoss: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  takeProfit: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PositionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PositionUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  tokenId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  side: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  size: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  avgEntryPrice: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  currentPrice: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  unrealizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  realizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  stopLoss: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  takeProfit: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StrategyConfigCreateInputSchema: z.ZodType<Prisma.StrategyConfigCreateInput> = z.object({
  id: z.string().optional(),
  name: z.string(),
  enabled: z.boolean().optional(),
  params: z.string().optional(),
  lastRunAt: z.coerce.date().optional().nullable(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const StrategyConfigUncheckedCreateInputSchema: z.ZodType<Prisma.StrategyConfigUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  name: z.string(),
  enabled: z.boolean().optional(),
  params: z.string().optional(),
  lastRunAt: z.coerce.date().optional().nullable(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const StrategyConfigUpdateInputSchema: z.ZodType<Prisma.StrategyConfigUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  params: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastRunAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StrategyConfigUncheckedUpdateInputSchema: z.ZodType<Prisma.StrategyConfigUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  params: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastRunAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StrategyConfigCreateManyInputSchema: z.ZodType<Prisma.StrategyConfigCreateManyInput> = z.object({
  id: z.string().optional(),
  name: z.string(),
  enabled: z.boolean().optional(),
  params: z.string().optional(),
  lastRunAt: z.coerce.date().optional().nullable(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const StrategyConfigUpdateManyMutationInputSchema: z.ZodType<Prisma.StrategyConfigUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  params: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastRunAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StrategyConfigUncheckedUpdateManyInputSchema: z.ZodType<Prisma.StrategyConfigUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  enabled: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  params: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  lastRunAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RiskConfigCreateInputSchema: z.ZodType<Prisma.RiskConfigCreateInput> = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  maxPositionSize: z.number().optional(),
  maxTotalExposure: z.number().optional(),
  maxDrawdown: z.number().optional(),
  stopLossPercent: z.number().optional(),
  takeProfitPercent: z.number().optional(),
  minArbitrageProfit: z.number().optional(),
  kellyFraction: z.number().optional(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const RiskConfigUncheckedCreateInputSchema: z.ZodType<Prisma.RiskConfigUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  maxPositionSize: z.number().optional(),
  maxTotalExposure: z.number().optional(),
  maxDrawdown: z.number().optional(),
  stopLossPercent: z.number().optional(),
  takeProfitPercent: z.number().optional(),
  minArbitrageProfit: z.number().optional(),
  kellyFraction: z.number().optional(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const RiskConfigUpdateInputSchema: z.ZodType<Prisma.RiskConfigUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  maxPositionSize: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  maxTotalExposure: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  maxDrawdown: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  stopLossPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  takeProfitPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minArbitrageProfit: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  kellyFraction: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RiskConfigUncheckedUpdateInputSchema: z.ZodType<Prisma.RiskConfigUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  maxPositionSize: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  maxTotalExposure: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  maxDrawdown: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  stopLossPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  takeProfitPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minArbitrageProfit: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  kellyFraction: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RiskConfigCreateManyInputSchema: z.ZodType<Prisma.RiskConfigCreateManyInput> = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  maxPositionSize: z.number().optional(),
  maxTotalExposure: z.number().optional(),
  maxDrawdown: z.number().optional(),
  stopLossPercent: z.number().optional(),
  takeProfitPercent: z.number().optional(),
  minArbitrageProfit: z.number().optional(),
  kellyFraction: z.number().optional(),
  updatedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional()
}).strict();

export const RiskConfigUpdateManyMutationInputSchema: z.ZodType<Prisma.RiskConfigUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  maxPositionSize: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  maxTotalExposure: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  maxDrawdown: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  stopLossPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  takeProfitPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minArbitrageProfit: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  kellyFraction: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const RiskConfigUncheckedUpdateManyInputSchema: z.ZodType<Prisma.RiskConfigUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  maxPositionSize: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  maxTotalExposure: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  maxDrawdown: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  stopLossPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  takeProfitPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  minArbitrageProfit: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  kellyFraction: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OpportunityLogCreateInputSchema: z.ZodType<Prisma.OpportunityLogCreateInput> = z.object({
  id: z.string().optional(),
  type: z.string(),
  marketIds: z.string(),
  expectedProfit: z.number(),
  expectedProfitPercent: z.number(),
  confidence: z.number(),
  status: z.string(),
  strategyName: z.string(),
  metadata: z.string().optional(),
  actualProfit: z.number().optional().nullable(),
  expiresAt: z.coerce.date(),
  executedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional()
}).strict();

export const OpportunityLogUncheckedCreateInputSchema: z.ZodType<Prisma.OpportunityLogUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  type: z.string(),
  marketIds: z.string(),
  expectedProfit: z.number(),
  expectedProfitPercent: z.number(),
  confidence: z.number(),
  status: z.string(),
  strategyName: z.string(),
  metadata: z.string().optional(),
  actualProfit: z.number().optional().nullable(),
  expiresAt: z.coerce.date(),
  executedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional()
}).strict();

export const OpportunityLogUpdateInputSchema: z.ZodType<Prisma.OpportunityLogUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketIds: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expectedProfit: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  expectedProfitPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  confidence: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  strategyName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actualProfit: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OpportunityLogUncheckedUpdateInputSchema: z.ZodType<Prisma.OpportunityLogUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketIds: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expectedProfit: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  expectedProfitPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  confidence: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  strategyName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actualProfit: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OpportunityLogCreateManyInputSchema: z.ZodType<Prisma.OpportunityLogCreateManyInput> = z.object({
  id: z.string().optional(),
  type: z.string(),
  marketIds: z.string(),
  expectedProfit: z.number(),
  expectedProfitPercent: z.number(),
  confidence: z.number(),
  status: z.string(),
  strategyName: z.string(),
  metadata: z.string().optional(),
  actualProfit: z.number().optional().nullable(),
  expiresAt: z.coerce.date(),
  executedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional()
}).strict();

export const OpportunityLogUpdateManyMutationInputSchema: z.ZodType<Prisma.OpportunityLogUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketIds: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expectedProfit: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  expectedProfitPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  confidence: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  strategyName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actualProfit: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OpportunityLogUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OpportunityLogUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  marketIds: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  expectedProfit: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  expectedProfitPercent: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  confidence: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  strategyName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  metadata: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  actualProfit: z.union([ z.number(),z.lazy(() => NullableFloatFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WeatherForecastCreateInputSchema: z.ZodType<Prisma.WeatherForecastCreateInput> = z.object({
  id: z.string().optional(),
  station: z.string(),
  date: z.string(),
  highF: z.number().int(),
  lowF: z.number().int(),
  leadDays: z.number().int(),
  narrative: z.string().optional(),
  precipChanceDay: z.number().int().optional().nullable(),
  precipChanceNight: z.number().int().optional().nullable(),
  qpf: z.number().optional(),
  fetchedAt: z.coerce.date().optional()
}).strict();

export const WeatherForecastUncheckedCreateInputSchema: z.ZodType<Prisma.WeatherForecastUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  station: z.string(),
  date: z.string(),
  highF: z.number().int(),
  lowF: z.number().int(),
  leadDays: z.number().int(),
  narrative: z.string().optional(),
  precipChanceDay: z.number().int().optional().nullable(),
  precipChanceNight: z.number().int().optional().nullable(),
  qpf: z.number().optional(),
  fetchedAt: z.coerce.date().optional()
}).strict();

export const WeatherForecastUpdateInputSchema: z.ZodType<Prisma.WeatherForecastUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  station: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  highF: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lowF: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  leadDays: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  narrative: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  precipChanceDay: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  precipChanceNight: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qpf: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fetchedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WeatherForecastUncheckedUpdateInputSchema: z.ZodType<Prisma.WeatherForecastUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  station: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  highF: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lowF: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  leadDays: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  narrative: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  precipChanceDay: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  precipChanceNight: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qpf: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fetchedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WeatherForecastCreateManyInputSchema: z.ZodType<Prisma.WeatherForecastCreateManyInput> = z.object({
  id: z.string().optional(),
  station: z.string(),
  date: z.string(),
  highF: z.number().int(),
  lowF: z.number().int(),
  leadDays: z.number().int(),
  narrative: z.string().optional(),
  precipChanceDay: z.number().int().optional().nullable(),
  precipChanceNight: z.number().int().optional().nullable(),
  qpf: z.number().optional(),
  fetchedAt: z.coerce.date().optional()
}).strict();

export const WeatherForecastUpdateManyMutationInputSchema: z.ZodType<Prisma.WeatherForecastUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  station: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  highF: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lowF: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  leadDays: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  narrative: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  precipChanceDay: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  precipChanceNight: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qpf: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fetchedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WeatherForecastUncheckedUpdateManyInputSchema: z.ZodType<Prisma.WeatherForecastUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  station: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  highF: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lowF: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  leadDays: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  narrative: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  precipChanceDay: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  precipChanceNight: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  qpf: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fetchedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WeatherObservationCreateInputSchema: z.ZodType<Prisma.WeatherObservationCreateInput> = z.object({
  id: z.string().optional(),
  station: z.string(),
  date: z.string(),
  highF: z.number().int().optional().nullable(),
  lowF: z.number().int().optional().nullable(),
  precip: z.number().optional(),
  weather: z.string().optional(),
  fetchedAt: z.coerce.date().optional()
}).strict();

export const WeatherObservationUncheckedCreateInputSchema: z.ZodType<Prisma.WeatherObservationUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  station: z.string(),
  date: z.string(),
  highF: z.number().int().optional().nullable(),
  lowF: z.number().int().optional().nullable(),
  precip: z.number().optional(),
  weather: z.string().optional(),
  fetchedAt: z.coerce.date().optional()
}).strict();

export const WeatherObservationUpdateInputSchema: z.ZodType<Prisma.WeatherObservationUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  station: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  highF: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lowF: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  precip: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  weather: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fetchedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WeatherObservationUncheckedUpdateInputSchema: z.ZodType<Prisma.WeatherObservationUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  station: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  highF: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lowF: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  precip: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  weather: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fetchedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WeatherObservationCreateManyInputSchema: z.ZodType<Prisma.WeatherObservationCreateManyInput> = z.object({
  id: z.string().optional(),
  station: z.string(),
  date: z.string(),
  highF: z.number().int().optional().nullable(),
  lowF: z.number().int().optional().nullable(),
  precip: z.number().optional(),
  weather: z.string().optional(),
  fetchedAt: z.coerce.date().optional()
}).strict();

export const WeatherObservationUpdateManyMutationInputSchema: z.ZodType<Prisma.WeatherObservationUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  station: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  highF: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lowF: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  precip: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  weather: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fetchedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const WeatherObservationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.WeatherObservationUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  station: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  highF: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lowF: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  precip: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  weather: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  fetchedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DailyPerformanceCreateInputSchema: z.ZodType<Prisma.DailyPerformanceCreateInput> = z.object({
  id: z.string().optional(),
  date: z.string(),
  realizedPnL: z.number().optional(),
  tradesCount: z.number().int().optional(),
  winCount: z.number().int().optional(),
  lossCount: z.number().int().optional(),
  volume: z.number().optional(),
  fees: z.number().optional(),
  opportunitiesFound: z.number().int().optional(),
  opportunitiesExecuted: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DailyPerformanceUncheckedCreateInputSchema: z.ZodType<Prisma.DailyPerformanceUncheckedCreateInput> = z.object({
  id: z.string().optional(),
  date: z.string(),
  realizedPnL: z.number().optional(),
  tradesCount: z.number().int().optional(),
  winCount: z.number().int().optional(),
  lossCount: z.number().int().optional(),
  volume: z.number().optional(),
  fees: z.number().optional(),
  opportunitiesFound: z.number().int().optional(),
  opportunitiesExecuted: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DailyPerformanceUpdateInputSchema: z.ZodType<Prisma.DailyPerformanceUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  realizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  tradesCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  winCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lossCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  volume: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fees: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  opportunitiesFound: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  opportunitiesExecuted: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DailyPerformanceUncheckedUpdateInputSchema: z.ZodType<Prisma.DailyPerformanceUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  realizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  tradesCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  winCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lossCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  volume: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fees: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  opportunitiesFound: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  opportunitiesExecuted: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DailyPerformanceCreateManyInputSchema: z.ZodType<Prisma.DailyPerformanceCreateManyInput> = z.object({
  id: z.string().optional(),
  date: z.string(),
  realizedPnL: z.number().optional(),
  tradesCount: z.number().int().optional(),
  winCount: z.number().int().optional(),
  lossCount: z.number().int().optional(),
  volume: z.number().optional(),
  fees: z.number().optional(),
  opportunitiesFound: z.number().int().optional(),
  opportunitiesExecuted: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const DailyPerformanceUpdateManyMutationInputSchema: z.ZodType<Prisma.DailyPerformanceUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  realizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  tradesCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  winCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lossCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  volume: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fees: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  opportunitiesFound: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  opportunitiesExecuted: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const DailyPerformanceUncheckedUpdateManyInputSchema: z.ZodType<Prisma.DailyPerformanceUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  date: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  realizedPnL: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  tradesCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  winCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  lossCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  volume: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  fees: z.union([ z.number(),z.lazy(() => FloatFieldUpdateOperationsInputSchema) ]).optional(),
  opportunitiesFound: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  opportunitiesExecuted: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
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

export const FloatFilterSchema: z.ZodType<Prisma.FloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

export const TradeCountOrderByAggregateInputSchema: z.ZodType<Prisma.TradeCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  fee: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  outcome: z.lazy(() => SortOrderSchema).optional(),
  strategyName: z.lazy(() => SortOrderSchema).optional(),
  transactionHash: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TradeAvgOrderByAggregateInputSchema: z.ZodType<Prisma.TradeAvgOrderByAggregateInput> = z.object({
  price: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  fee: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TradeMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TradeMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  fee: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  outcome: z.lazy(() => SortOrderSchema).optional(),
  strategyName: z.lazy(() => SortOrderSchema).optional(),
  transactionHash: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TradeMinOrderByAggregateInputSchema: z.ZodType<Prisma.TradeMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  orderId: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  price: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  fee: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  outcome: z.lazy(() => SortOrderSchema).optional(),
  strategyName: z.lazy(() => SortOrderSchema).optional(),
  transactionHash: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const TradeSumOrderByAggregateInputSchema: z.ZodType<Prisma.TradeSumOrderByAggregateInput> = z.object({
  price: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  fee: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const FloatWithAggregatesFilterSchema: z.ZodType<Prisma.FloatWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatFilterSchema).optional()
}).strict();

export const FloatNullableFilterSchema: z.ZodType<Prisma.FloatNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const PositionCountOrderByAggregateInputSchema: z.ZodType<Prisma.PositionCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  avgEntryPrice: z.lazy(() => SortOrderSchema).optional(),
  currentPrice: z.lazy(() => SortOrderSchema).optional(),
  unrealizedPnL: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  stopLoss: z.lazy(() => SortOrderSchema).optional(),
  takeProfit: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PositionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PositionAvgOrderByAggregateInput> = z.object({
  size: z.lazy(() => SortOrderSchema).optional(),
  avgEntryPrice: z.lazy(() => SortOrderSchema).optional(),
  currentPrice: z.lazy(() => SortOrderSchema).optional(),
  unrealizedPnL: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  stopLoss: z.lazy(() => SortOrderSchema).optional(),
  takeProfit: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PositionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PositionMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  avgEntryPrice: z.lazy(() => SortOrderSchema).optional(),
  currentPrice: z.lazy(() => SortOrderSchema).optional(),
  unrealizedPnL: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  stopLoss: z.lazy(() => SortOrderSchema).optional(),
  takeProfit: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PositionMinOrderByAggregateInputSchema: z.ZodType<Prisma.PositionMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  marketId: z.lazy(() => SortOrderSchema).optional(),
  tokenId: z.lazy(() => SortOrderSchema).optional(),
  side: z.lazy(() => SortOrderSchema).optional(),
  size: z.lazy(() => SortOrderSchema).optional(),
  avgEntryPrice: z.lazy(() => SortOrderSchema).optional(),
  currentPrice: z.lazy(() => SortOrderSchema).optional(),
  unrealizedPnL: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  stopLoss: z.lazy(() => SortOrderSchema).optional(),
  takeProfit: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PositionSumOrderByAggregateInputSchema: z.ZodType<Prisma.PositionSumOrderByAggregateInput> = z.object({
  size: z.lazy(() => SortOrderSchema).optional(),
  avgEntryPrice: z.lazy(() => SortOrderSchema).optional(),
  currentPrice: z.lazy(() => SortOrderSchema).optional(),
  unrealizedPnL: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  stopLoss: z.lazy(() => SortOrderSchema).optional(),
  takeProfit: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const FloatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.FloatNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatNullableFilterSchema).optional()
}).strict();

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
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

export const StrategyConfigCountOrderByAggregateInputSchema: z.ZodType<Prisma.StrategyConfigCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  params: z.lazy(() => SortOrderSchema).optional(),
  lastRunAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StrategyConfigMaxOrderByAggregateInputSchema: z.ZodType<Prisma.StrategyConfigMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  params: z.lazy(() => SortOrderSchema).optional(),
  lastRunAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StrategyConfigMinOrderByAggregateInputSchema: z.ZodType<Prisma.StrategyConfigMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  enabled: z.lazy(() => SortOrderSchema).optional(),
  params: z.lazy(() => SortOrderSchema).optional(),
  lastRunAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
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

export const RiskConfigCountOrderByAggregateInputSchema: z.ZodType<Prisma.RiskConfigCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  maxPositionSize: z.lazy(() => SortOrderSchema).optional(),
  maxTotalExposure: z.lazy(() => SortOrderSchema).optional(),
  maxDrawdown: z.lazy(() => SortOrderSchema).optional(),
  stopLossPercent: z.lazy(() => SortOrderSchema).optional(),
  takeProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  minArbitrageProfit: z.lazy(() => SortOrderSchema).optional(),
  kellyFraction: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RiskConfigAvgOrderByAggregateInputSchema: z.ZodType<Prisma.RiskConfigAvgOrderByAggregateInput> = z.object({
  maxPositionSize: z.lazy(() => SortOrderSchema).optional(),
  maxTotalExposure: z.lazy(() => SortOrderSchema).optional(),
  maxDrawdown: z.lazy(() => SortOrderSchema).optional(),
  stopLossPercent: z.lazy(() => SortOrderSchema).optional(),
  takeProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  minArbitrageProfit: z.lazy(() => SortOrderSchema).optional(),
  kellyFraction: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RiskConfigMaxOrderByAggregateInputSchema: z.ZodType<Prisma.RiskConfigMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  maxPositionSize: z.lazy(() => SortOrderSchema).optional(),
  maxTotalExposure: z.lazy(() => SortOrderSchema).optional(),
  maxDrawdown: z.lazy(() => SortOrderSchema).optional(),
  stopLossPercent: z.lazy(() => SortOrderSchema).optional(),
  takeProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  minArbitrageProfit: z.lazy(() => SortOrderSchema).optional(),
  kellyFraction: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RiskConfigMinOrderByAggregateInputSchema: z.ZodType<Prisma.RiskConfigMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  maxPositionSize: z.lazy(() => SortOrderSchema).optional(),
  maxTotalExposure: z.lazy(() => SortOrderSchema).optional(),
  maxDrawdown: z.lazy(() => SortOrderSchema).optional(),
  stopLossPercent: z.lazy(() => SortOrderSchema).optional(),
  takeProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  minArbitrageProfit: z.lazy(() => SortOrderSchema).optional(),
  kellyFraction: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const RiskConfigSumOrderByAggregateInputSchema: z.ZodType<Prisma.RiskConfigSumOrderByAggregateInput> = z.object({
  maxPositionSize: z.lazy(() => SortOrderSchema).optional(),
  maxTotalExposure: z.lazy(() => SortOrderSchema).optional(),
  maxDrawdown: z.lazy(() => SortOrderSchema).optional(),
  stopLossPercent: z.lazy(() => SortOrderSchema).optional(),
  takeProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  minArbitrageProfit: z.lazy(() => SortOrderSchema).optional(),
  kellyFraction: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OpportunityLogCountOrderByAggregateInputSchema: z.ZodType<Prisma.OpportunityLogCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  marketIds: z.lazy(() => SortOrderSchema).optional(),
  expectedProfit: z.lazy(() => SortOrderSchema).optional(),
  expectedProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  confidence: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  strategyName: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.lazy(() => SortOrderSchema).optional(),
  actualProfit: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OpportunityLogAvgOrderByAggregateInputSchema: z.ZodType<Prisma.OpportunityLogAvgOrderByAggregateInput> = z.object({
  expectedProfit: z.lazy(() => SortOrderSchema).optional(),
  expectedProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  confidence: z.lazy(() => SortOrderSchema).optional(),
  actualProfit: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OpportunityLogMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OpportunityLogMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  marketIds: z.lazy(() => SortOrderSchema).optional(),
  expectedProfit: z.lazy(() => SortOrderSchema).optional(),
  expectedProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  confidence: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  strategyName: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.lazy(() => SortOrderSchema).optional(),
  actualProfit: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OpportunityLogMinOrderByAggregateInputSchema: z.ZodType<Prisma.OpportunityLogMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  marketIds: z.lazy(() => SortOrderSchema).optional(),
  expectedProfit: z.lazy(() => SortOrderSchema).optional(),
  expectedProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  confidence: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  strategyName: z.lazy(() => SortOrderSchema).optional(),
  metadata: z.lazy(() => SortOrderSchema).optional(),
  actualProfit: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OpportunityLogSumOrderByAggregateInputSchema: z.ZodType<Prisma.OpportunityLogSumOrderByAggregateInput> = z.object({
  expectedProfit: z.lazy(() => SortOrderSchema).optional(),
  expectedProfitPercent: z.lazy(() => SortOrderSchema).optional(),
  confidence: z.lazy(() => SortOrderSchema).optional(),
  actualProfit: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntNullableFilterSchema: z.ZodType<Prisma.IntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const WeatherForecastStationDateFetchedAtCompoundUniqueInputSchema: z.ZodType<Prisma.WeatherForecastStationDateFetchedAtCompoundUniqueInput> = z.object({
  station: z.string(),
  date: z.string(),
  fetchedAt: z.coerce.date()
}).strict();

export const WeatherForecastCountOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherForecastCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  leadDays: z.lazy(() => SortOrderSchema).optional(),
  narrative: z.lazy(() => SortOrderSchema).optional(),
  precipChanceDay: z.lazy(() => SortOrderSchema).optional(),
  precipChanceNight: z.lazy(() => SortOrderSchema).optional(),
  qpf: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherForecastAvgOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherForecastAvgOrderByAggregateInput> = z.object({
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  leadDays: z.lazy(() => SortOrderSchema).optional(),
  precipChanceDay: z.lazy(() => SortOrderSchema).optional(),
  precipChanceNight: z.lazy(() => SortOrderSchema).optional(),
  qpf: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherForecastMaxOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherForecastMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  leadDays: z.lazy(() => SortOrderSchema).optional(),
  narrative: z.lazy(() => SortOrderSchema).optional(),
  precipChanceDay: z.lazy(() => SortOrderSchema).optional(),
  precipChanceNight: z.lazy(() => SortOrderSchema).optional(),
  qpf: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherForecastMinOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherForecastMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  leadDays: z.lazy(() => SortOrderSchema).optional(),
  narrative: z.lazy(() => SortOrderSchema).optional(),
  precipChanceDay: z.lazy(() => SortOrderSchema).optional(),
  precipChanceNight: z.lazy(() => SortOrderSchema).optional(),
  qpf: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherForecastSumOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherForecastSumOrderByAggregateInput> = z.object({
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  leadDays: z.lazy(() => SortOrderSchema).optional(),
  precipChanceDay: z.lazy(() => SortOrderSchema).optional(),
  precipChanceNight: z.lazy(() => SortOrderSchema).optional(),
  qpf: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.IntNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional()
}).strict();

export const WeatherObservationStationDateCompoundUniqueInputSchema: z.ZodType<Prisma.WeatherObservationStationDateCompoundUniqueInput> = z.object({
  station: z.string(),
  date: z.string()
}).strict();

export const WeatherObservationCountOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherObservationCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  precip: z.lazy(() => SortOrderSchema).optional(),
  weather: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherObservationAvgOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherObservationAvgOrderByAggregateInput> = z.object({
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  precip: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherObservationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherObservationMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  precip: z.lazy(() => SortOrderSchema).optional(),
  weather: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherObservationMinOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherObservationMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  station: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  precip: z.lazy(() => SortOrderSchema).optional(),
  weather: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const WeatherObservationSumOrderByAggregateInputSchema: z.ZodType<Prisma.WeatherObservationSumOrderByAggregateInput> = z.object({
  highF: z.lazy(() => SortOrderSchema).optional(),
  lowF: z.lazy(() => SortOrderSchema).optional(),
  precip: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyPerformanceCountOrderByAggregateInputSchema: z.ZodType<Prisma.DailyPerformanceCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  tradesCount: z.lazy(() => SortOrderSchema).optional(),
  winCount: z.lazy(() => SortOrderSchema).optional(),
  lossCount: z.lazy(() => SortOrderSchema).optional(),
  volume: z.lazy(() => SortOrderSchema).optional(),
  fees: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesFound: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesExecuted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyPerformanceAvgOrderByAggregateInputSchema: z.ZodType<Prisma.DailyPerformanceAvgOrderByAggregateInput> = z.object({
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  tradesCount: z.lazy(() => SortOrderSchema).optional(),
  winCount: z.lazy(() => SortOrderSchema).optional(),
  lossCount: z.lazy(() => SortOrderSchema).optional(),
  volume: z.lazy(() => SortOrderSchema).optional(),
  fees: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesFound: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesExecuted: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyPerformanceMaxOrderByAggregateInputSchema: z.ZodType<Prisma.DailyPerformanceMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  tradesCount: z.lazy(() => SortOrderSchema).optional(),
  winCount: z.lazy(() => SortOrderSchema).optional(),
  lossCount: z.lazy(() => SortOrderSchema).optional(),
  volume: z.lazy(() => SortOrderSchema).optional(),
  fees: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesFound: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesExecuted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyPerformanceMinOrderByAggregateInputSchema: z.ZodType<Prisma.DailyPerformanceMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  date: z.lazy(() => SortOrderSchema).optional(),
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  tradesCount: z.lazy(() => SortOrderSchema).optional(),
  winCount: z.lazy(() => SortOrderSchema).optional(),
  lossCount: z.lazy(() => SortOrderSchema).optional(),
  volume: z.lazy(() => SortOrderSchema).optional(),
  fees: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesFound: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesExecuted: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const DailyPerformanceSumOrderByAggregateInputSchema: z.ZodType<Prisma.DailyPerformanceSumOrderByAggregateInput> = z.object({
  realizedPnL: z.lazy(() => SortOrderSchema).optional(),
  tradesCount: z.lazy(() => SortOrderSchema).optional(),
  winCount: z.lazy(() => SortOrderSchema).optional(),
  lossCount: z.lazy(() => SortOrderSchema).optional(),
  volume: z.lazy(() => SortOrderSchema).optional(),
  fees: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesFound: z.lazy(() => SortOrderSchema).optional(),
  opportunitiesExecuted: z.lazy(() => SortOrderSchema).optional()
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

export const FloatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.FloatFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const NullableFloatFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableFloatFieldUpdateOperationsInput> = z.object({
  set: z.number().optional().nullable(),
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

export const NullableIntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableIntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional().nullable(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
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

export const NestedFloatWithAggregatesFilterSchema: z.ZodType<Prisma.NestedFloatWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatFilterSchema).optional()
}).strict();

export const NestedFloatNullableFilterSchema: z.ZodType<Prisma.NestedFloatNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedFloatNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedFloatNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedFloatNullableFilterSchema).optional()
}).strict();

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
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

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
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

export const NestedIntNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntNullableWithAggregatesFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatNullableFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedIntNullableFilterSchema).optional()
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

export const TradeFindFirstArgsSchema: z.ZodType<Prisma.TradeFindFirstArgs> = z.object({
  select: TradeSelectSchema.optional(),
  where: TradeWhereInputSchema.optional(),
  orderBy: z.union([ TradeOrderByWithRelationInputSchema.array(),TradeOrderByWithRelationInputSchema ]).optional(),
  cursor: TradeWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TradeScalarFieldEnumSchema,TradeScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TradeFindFirstOrThrowArgsSchema: z.ZodType<Prisma.TradeFindFirstOrThrowArgs> = z.object({
  select: TradeSelectSchema.optional(),
  where: TradeWhereInputSchema.optional(),
  orderBy: z.union([ TradeOrderByWithRelationInputSchema.array(),TradeOrderByWithRelationInputSchema ]).optional(),
  cursor: TradeWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TradeScalarFieldEnumSchema,TradeScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TradeFindManyArgsSchema: z.ZodType<Prisma.TradeFindManyArgs> = z.object({
  select: TradeSelectSchema.optional(),
  where: TradeWhereInputSchema.optional(),
  orderBy: z.union([ TradeOrderByWithRelationInputSchema.array(),TradeOrderByWithRelationInputSchema ]).optional(),
  cursor: TradeWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ TradeScalarFieldEnumSchema,TradeScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const TradeAggregateArgsSchema: z.ZodType<Prisma.TradeAggregateArgs> = z.object({
  where: TradeWhereInputSchema.optional(),
  orderBy: z.union([ TradeOrderByWithRelationInputSchema.array(),TradeOrderByWithRelationInputSchema ]).optional(),
  cursor: TradeWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const TradeGroupByArgsSchema: z.ZodType<Prisma.TradeGroupByArgs> = z.object({
  where: TradeWhereInputSchema.optional(),
  orderBy: z.union([ TradeOrderByWithAggregationInputSchema.array(),TradeOrderByWithAggregationInputSchema ]).optional(),
  by: TradeScalarFieldEnumSchema.array(),
  having: TradeScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const TradeFindUniqueArgsSchema: z.ZodType<Prisma.TradeFindUniqueArgs> = z.object({
  select: TradeSelectSchema.optional(),
  where: TradeWhereUniqueInputSchema,
}).strict() ;

export const TradeFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.TradeFindUniqueOrThrowArgs> = z.object({
  select: TradeSelectSchema.optional(),
  where: TradeWhereUniqueInputSchema,
}).strict() ;

export const PositionFindFirstArgsSchema: z.ZodType<Prisma.PositionFindFirstArgs> = z.object({
  select: PositionSelectSchema.optional(),
  where: PositionWhereInputSchema.optional(),
  orderBy: z.union([ PositionOrderByWithRelationInputSchema.array(),PositionOrderByWithRelationInputSchema ]).optional(),
  cursor: PositionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PositionScalarFieldEnumSchema,PositionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PositionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PositionFindFirstOrThrowArgs> = z.object({
  select: PositionSelectSchema.optional(),
  where: PositionWhereInputSchema.optional(),
  orderBy: z.union([ PositionOrderByWithRelationInputSchema.array(),PositionOrderByWithRelationInputSchema ]).optional(),
  cursor: PositionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PositionScalarFieldEnumSchema,PositionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PositionFindManyArgsSchema: z.ZodType<Prisma.PositionFindManyArgs> = z.object({
  select: PositionSelectSchema.optional(),
  where: PositionWhereInputSchema.optional(),
  orderBy: z.union([ PositionOrderByWithRelationInputSchema.array(),PositionOrderByWithRelationInputSchema ]).optional(),
  cursor: PositionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PositionScalarFieldEnumSchema,PositionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PositionAggregateArgsSchema: z.ZodType<Prisma.PositionAggregateArgs> = z.object({
  where: PositionWhereInputSchema.optional(),
  orderBy: z.union([ PositionOrderByWithRelationInputSchema.array(),PositionOrderByWithRelationInputSchema ]).optional(),
  cursor: PositionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PositionGroupByArgsSchema: z.ZodType<Prisma.PositionGroupByArgs> = z.object({
  where: PositionWhereInputSchema.optional(),
  orderBy: z.union([ PositionOrderByWithAggregationInputSchema.array(),PositionOrderByWithAggregationInputSchema ]).optional(),
  by: PositionScalarFieldEnumSchema.array(),
  having: PositionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PositionFindUniqueArgsSchema: z.ZodType<Prisma.PositionFindUniqueArgs> = z.object({
  select: PositionSelectSchema.optional(),
  where: PositionWhereUniqueInputSchema,
}).strict() ;

export const PositionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PositionFindUniqueOrThrowArgs> = z.object({
  select: PositionSelectSchema.optional(),
  where: PositionWhereUniqueInputSchema,
}).strict() ;

export const StrategyConfigFindFirstArgsSchema: z.ZodType<Prisma.StrategyConfigFindFirstArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  where: StrategyConfigWhereInputSchema.optional(),
  orderBy: z.union([ StrategyConfigOrderByWithRelationInputSchema.array(),StrategyConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: StrategyConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StrategyConfigScalarFieldEnumSchema,StrategyConfigScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const StrategyConfigFindFirstOrThrowArgsSchema: z.ZodType<Prisma.StrategyConfigFindFirstOrThrowArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  where: StrategyConfigWhereInputSchema.optional(),
  orderBy: z.union([ StrategyConfigOrderByWithRelationInputSchema.array(),StrategyConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: StrategyConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StrategyConfigScalarFieldEnumSchema,StrategyConfigScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const StrategyConfigFindManyArgsSchema: z.ZodType<Prisma.StrategyConfigFindManyArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  where: StrategyConfigWhereInputSchema.optional(),
  orderBy: z.union([ StrategyConfigOrderByWithRelationInputSchema.array(),StrategyConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: StrategyConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ StrategyConfigScalarFieldEnumSchema,StrategyConfigScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const StrategyConfigAggregateArgsSchema: z.ZodType<Prisma.StrategyConfigAggregateArgs> = z.object({
  where: StrategyConfigWhereInputSchema.optional(),
  orderBy: z.union([ StrategyConfigOrderByWithRelationInputSchema.array(),StrategyConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: StrategyConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const StrategyConfigGroupByArgsSchema: z.ZodType<Prisma.StrategyConfigGroupByArgs> = z.object({
  where: StrategyConfigWhereInputSchema.optional(),
  orderBy: z.union([ StrategyConfigOrderByWithAggregationInputSchema.array(),StrategyConfigOrderByWithAggregationInputSchema ]).optional(),
  by: StrategyConfigScalarFieldEnumSchema.array(),
  having: StrategyConfigScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const StrategyConfigFindUniqueArgsSchema: z.ZodType<Prisma.StrategyConfigFindUniqueArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  where: StrategyConfigWhereUniqueInputSchema,
}).strict() ;

export const StrategyConfigFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.StrategyConfigFindUniqueOrThrowArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  where: StrategyConfigWhereUniqueInputSchema,
}).strict() ;

export const RiskConfigFindFirstArgsSchema: z.ZodType<Prisma.RiskConfigFindFirstArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  where: RiskConfigWhereInputSchema.optional(),
  orderBy: z.union([ RiskConfigOrderByWithRelationInputSchema.array(),RiskConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: RiskConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RiskConfigScalarFieldEnumSchema,RiskConfigScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RiskConfigFindFirstOrThrowArgsSchema: z.ZodType<Prisma.RiskConfigFindFirstOrThrowArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  where: RiskConfigWhereInputSchema.optional(),
  orderBy: z.union([ RiskConfigOrderByWithRelationInputSchema.array(),RiskConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: RiskConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RiskConfigScalarFieldEnumSchema,RiskConfigScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RiskConfigFindManyArgsSchema: z.ZodType<Prisma.RiskConfigFindManyArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  where: RiskConfigWhereInputSchema.optional(),
  orderBy: z.union([ RiskConfigOrderByWithRelationInputSchema.array(),RiskConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: RiskConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ RiskConfigScalarFieldEnumSchema,RiskConfigScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const RiskConfigAggregateArgsSchema: z.ZodType<Prisma.RiskConfigAggregateArgs> = z.object({
  where: RiskConfigWhereInputSchema.optional(),
  orderBy: z.union([ RiskConfigOrderByWithRelationInputSchema.array(),RiskConfigOrderByWithRelationInputSchema ]).optional(),
  cursor: RiskConfigWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const RiskConfigGroupByArgsSchema: z.ZodType<Prisma.RiskConfigGroupByArgs> = z.object({
  where: RiskConfigWhereInputSchema.optional(),
  orderBy: z.union([ RiskConfigOrderByWithAggregationInputSchema.array(),RiskConfigOrderByWithAggregationInputSchema ]).optional(),
  by: RiskConfigScalarFieldEnumSchema.array(),
  having: RiskConfigScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const RiskConfigFindUniqueArgsSchema: z.ZodType<Prisma.RiskConfigFindUniqueArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  where: RiskConfigWhereUniqueInputSchema,
}).strict() ;

export const RiskConfigFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.RiskConfigFindUniqueOrThrowArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  where: RiskConfigWhereUniqueInputSchema,
}).strict() ;

export const OpportunityLogFindFirstArgsSchema: z.ZodType<Prisma.OpportunityLogFindFirstArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  where: OpportunityLogWhereInputSchema.optional(),
  orderBy: z.union([ OpportunityLogOrderByWithRelationInputSchema.array(),OpportunityLogOrderByWithRelationInputSchema ]).optional(),
  cursor: OpportunityLogWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OpportunityLogScalarFieldEnumSchema,OpportunityLogScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OpportunityLogFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OpportunityLogFindFirstOrThrowArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  where: OpportunityLogWhereInputSchema.optional(),
  orderBy: z.union([ OpportunityLogOrderByWithRelationInputSchema.array(),OpportunityLogOrderByWithRelationInputSchema ]).optional(),
  cursor: OpportunityLogWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OpportunityLogScalarFieldEnumSchema,OpportunityLogScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OpportunityLogFindManyArgsSchema: z.ZodType<Prisma.OpportunityLogFindManyArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  where: OpportunityLogWhereInputSchema.optional(),
  orderBy: z.union([ OpportunityLogOrderByWithRelationInputSchema.array(),OpportunityLogOrderByWithRelationInputSchema ]).optional(),
  cursor: OpportunityLogWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OpportunityLogScalarFieldEnumSchema,OpportunityLogScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OpportunityLogAggregateArgsSchema: z.ZodType<Prisma.OpportunityLogAggregateArgs> = z.object({
  where: OpportunityLogWhereInputSchema.optional(),
  orderBy: z.union([ OpportunityLogOrderByWithRelationInputSchema.array(),OpportunityLogOrderByWithRelationInputSchema ]).optional(),
  cursor: OpportunityLogWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const OpportunityLogGroupByArgsSchema: z.ZodType<Prisma.OpportunityLogGroupByArgs> = z.object({
  where: OpportunityLogWhereInputSchema.optional(),
  orderBy: z.union([ OpportunityLogOrderByWithAggregationInputSchema.array(),OpportunityLogOrderByWithAggregationInputSchema ]).optional(),
  by: OpportunityLogScalarFieldEnumSchema.array(),
  having: OpportunityLogScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const OpportunityLogFindUniqueArgsSchema: z.ZodType<Prisma.OpportunityLogFindUniqueArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  where: OpportunityLogWhereUniqueInputSchema,
}).strict() ;

export const OpportunityLogFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OpportunityLogFindUniqueOrThrowArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  where: OpportunityLogWhereUniqueInputSchema,
}).strict() ;

export const WeatherForecastFindFirstArgsSchema: z.ZodType<Prisma.WeatherForecastFindFirstArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  where: WeatherForecastWhereInputSchema.optional(),
  orderBy: z.union([ WeatherForecastOrderByWithRelationInputSchema.array(),WeatherForecastOrderByWithRelationInputSchema ]).optional(),
  cursor: WeatherForecastWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WeatherForecastScalarFieldEnumSchema,WeatherForecastScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WeatherForecastFindFirstOrThrowArgsSchema: z.ZodType<Prisma.WeatherForecastFindFirstOrThrowArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  where: WeatherForecastWhereInputSchema.optional(),
  orderBy: z.union([ WeatherForecastOrderByWithRelationInputSchema.array(),WeatherForecastOrderByWithRelationInputSchema ]).optional(),
  cursor: WeatherForecastWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WeatherForecastScalarFieldEnumSchema,WeatherForecastScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WeatherForecastFindManyArgsSchema: z.ZodType<Prisma.WeatherForecastFindManyArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  where: WeatherForecastWhereInputSchema.optional(),
  orderBy: z.union([ WeatherForecastOrderByWithRelationInputSchema.array(),WeatherForecastOrderByWithRelationInputSchema ]).optional(),
  cursor: WeatherForecastWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WeatherForecastScalarFieldEnumSchema,WeatherForecastScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WeatherForecastAggregateArgsSchema: z.ZodType<Prisma.WeatherForecastAggregateArgs> = z.object({
  where: WeatherForecastWhereInputSchema.optional(),
  orderBy: z.union([ WeatherForecastOrderByWithRelationInputSchema.array(),WeatherForecastOrderByWithRelationInputSchema ]).optional(),
  cursor: WeatherForecastWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WeatherForecastGroupByArgsSchema: z.ZodType<Prisma.WeatherForecastGroupByArgs> = z.object({
  where: WeatherForecastWhereInputSchema.optional(),
  orderBy: z.union([ WeatherForecastOrderByWithAggregationInputSchema.array(),WeatherForecastOrderByWithAggregationInputSchema ]).optional(),
  by: WeatherForecastScalarFieldEnumSchema.array(),
  having: WeatherForecastScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WeatherForecastFindUniqueArgsSchema: z.ZodType<Prisma.WeatherForecastFindUniqueArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  where: WeatherForecastWhereUniqueInputSchema,
}).strict() ;

export const WeatherForecastFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.WeatherForecastFindUniqueOrThrowArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  where: WeatherForecastWhereUniqueInputSchema,
}).strict() ;

export const WeatherObservationFindFirstArgsSchema: z.ZodType<Prisma.WeatherObservationFindFirstArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  where: WeatherObservationWhereInputSchema.optional(),
  orderBy: z.union([ WeatherObservationOrderByWithRelationInputSchema.array(),WeatherObservationOrderByWithRelationInputSchema ]).optional(),
  cursor: WeatherObservationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WeatherObservationScalarFieldEnumSchema,WeatherObservationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WeatherObservationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.WeatherObservationFindFirstOrThrowArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  where: WeatherObservationWhereInputSchema.optional(),
  orderBy: z.union([ WeatherObservationOrderByWithRelationInputSchema.array(),WeatherObservationOrderByWithRelationInputSchema ]).optional(),
  cursor: WeatherObservationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WeatherObservationScalarFieldEnumSchema,WeatherObservationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WeatherObservationFindManyArgsSchema: z.ZodType<Prisma.WeatherObservationFindManyArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  where: WeatherObservationWhereInputSchema.optional(),
  orderBy: z.union([ WeatherObservationOrderByWithRelationInputSchema.array(),WeatherObservationOrderByWithRelationInputSchema ]).optional(),
  cursor: WeatherObservationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ WeatherObservationScalarFieldEnumSchema,WeatherObservationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const WeatherObservationAggregateArgsSchema: z.ZodType<Prisma.WeatherObservationAggregateArgs> = z.object({
  where: WeatherObservationWhereInputSchema.optional(),
  orderBy: z.union([ WeatherObservationOrderByWithRelationInputSchema.array(),WeatherObservationOrderByWithRelationInputSchema ]).optional(),
  cursor: WeatherObservationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WeatherObservationGroupByArgsSchema: z.ZodType<Prisma.WeatherObservationGroupByArgs> = z.object({
  where: WeatherObservationWhereInputSchema.optional(),
  orderBy: z.union([ WeatherObservationOrderByWithAggregationInputSchema.array(),WeatherObservationOrderByWithAggregationInputSchema ]).optional(),
  by: WeatherObservationScalarFieldEnumSchema.array(),
  having: WeatherObservationScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const WeatherObservationFindUniqueArgsSchema: z.ZodType<Prisma.WeatherObservationFindUniqueArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  where: WeatherObservationWhereUniqueInputSchema,
}).strict() ;

export const WeatherObservationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.WeatherObservationFindUniqueOrThrowArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  where: WeatherObservationWhereUniqueInputSchema,
}).strict() ;

export const DailyPerformanceFindFirstArgsSchema: z.ZodType<Prisma.DailyPerformanceFindFirstArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  where: DailyPerformanceWhereInputSchema.optional(),
  orderBy: z.union([ DailyPerformanceOrderByWithRelationInputSchema.array(),DailyPerformanceOrderByWithRelationInputSchema ]).optional(),
  cursor: DailyPerformanceWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DailyPerformanceScalarFieldEnumSchema,DailyPerformanceScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DailyPerformanceFindFirstOrThrowArgsSchema: z.ZodType<Prisma.DailyPerformanceFindFirstOrThrowArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  where: DailyPerformanceWhereInputSchema.optional(),
  orderBy: z.union([ DailyPerformanceOrderByWithRelationInputSchema.array(),DailyPerformanceOrderByWithRelationInputSchema ]).optional(),
  cursor: DailyPerformanceWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DailyPerformanceScalarFieldEnumSchema,DailyPerformanceScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DailyPerformanceFindManyArgsSchema: z.ZodType<Prisma.DailyPerformanceFindManyArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  where: DailyPerformanceWhereInputSchema.optional(),
  orderBy: z.union([ DailyPerformanceOrderByWithRelationInputSchema.array(),DailyPerformanceOrderByWithRelationInputSchema ]).optional(),
  cursor: DailyPerformanceWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DailyPerformanceScalarFieldEnumSchema,DailyPerformanceScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const DailyPerformanceAggregateArgsSchema: z.ZodType<Prisma.DailyPerformanceAggregateArgs> = z.object({
  where: DailyPerformanceWhereInputSchema.optional(),
  orderBy: z.union([ DailyPerformanceOrderByWithRelationInputSchema.array(),DailyPerformanceOrderByWithRelationInputSchema ]).optional(),
  cursor: DailyPerformanceWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const DailyPerformanceGroupByArgsSchema: z.ZodType<Prisma.DailyPerformanceGroupByArgs> = z.object({
  where: DailyPerformanceWhereInputSchema.optional(),
  orderBy: z.union([ DailyPerformanceOrderByWithAggregationInputSchema.array(),DailyPerformanceOrderByWithAggregationInputSchema ]).optional(),
  by: DailyPerformanceScalarFieldEnumSchema.array(),
  having: DailyPerformanceScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const DailyPerformanceFindUniqueArgsSchema: z.ZodType<Prisma.DailyPerformanceFindUniqueArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  where: DailyPerformanceWhereUniqueInputSchema,
}).strict() ;

export const DailyPerformanceFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.DailyPerformanceFindUniqueOrThrowArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  where: DailyPerformanceWhereUniqueInputSchema,
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

export const TradeCreateArgsSchema: z.ZodType<Prisma.TradeCreateArgs> = z.object({
  select: TradeSelectSchema.optional(),
  data: z.union([ TradeCreateInputSchema,TradeUncheckedCreateInputSchema ]),
}).strict() ;

export const TradeUpsertArgsSchema: z.ZodType<Prisma.TradeUpsertArgs> = z.object({
  select: TradeSelectSchema.optional(),
  where: TradeWhereUniqueInputSchema,
  create: z.union([ TradeCreateInputSchema,TradeUncheckedCreateInputSchema ]),
  update: z.union([ TradeUpdateInputSchema,TradeUncheckedUpdateInputSchema ]),
}).strict() ;

export const TradeCreateManyArgsSchema: z.ZodType<Prisma.TradeCreateManyArgs> = z.object({
  data: z.union([ TradeCreateManyInputSchema,TradeCreateManyInputSchema.array() ]),
}).strict() ;

export const TradeCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TradeCreateManyAndReturnArgs> = z.object({
  data: z.union([ TradeCreateManyInputSchema,TradeCreateManyInputSchema.array() ]),
}).strict() ;

export const TradeDeleteArgsSchema: z.ZodType<Prisma.TradeDeleteArgs> = z.object({
  select: TradeSelectSchema.optional(),
  where: TradeWhereUniqueInputSchema,
}).strict() ;

export const TradeUpdateArgsSchema: z.ZodType<Prisma.TradeUpdateArgs> = z.object({
  select: TradeSelectSchema.optional(),
  data: z.union([ TradeUpdateInputSchema,TradeUncheckedUpdateInputSchema ]),
  where: TradeWhereUniqueInputSchema,
}).strict() ;

export const TradeUpdateManyArgsSchema: z.ZodType<Prisma.TradeUpdateManyArgs> = z.object({
  data: z.union([ TradeUpdateManyMutationInputSchema,TradeUncheckedUpdateManyInputSchema ]),
  where: TradeWhereInputSchema.optional(),
}).strict() ;

export const TradeDeleteManyArgsSchema: z.ZodType<Prisma.TradeDeleteManyArgs> = z.object({
  where: TradeWhereInputSchema.optional(),
}).strict() ;

export const PositionCreateArgsSchema: z.ZodType<Prisma.PositionCreateArgs> = z.object({
  select: PositionSelectSchema.optional(),
  data: z.union([ PositionCreateInputSchema,PositionUncheckedCreateInputSchema ]),
}).strict() ;

export const PositionUpsertArgsSchema: z.ZodType<Prisma.PositionUpsertArgs> = z.object({
  select: PositionSelectSchema.optional(),
  where: PositionWhereUniqueInputSchema,
  create: z.union([ PositionCreateInputSchema,PositionUncheckedCreateInputSchema ]),
  update: z.union([ PositionUpdateInputSchema,PositionUncheckedUpdateInputSchema ]),
}).strict() ;

export const PositionCreateManyArgsSchema: z.ZodType<Prisma.PositionCreateManyArgs> = z.object({
  data: z.union([ PositionCreateManyInputSchema,PositionCreateManyInputSchema.array() ]),
}).strict() ;

export const PositionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PositionCreateManyAndReturnArgs> = z.object({
  data: z.union([ PositionCreateManyInputSchema,PositionCreateManyInputSchema.array() ]),
}).strict() ;

export const PositionDeleteArgsSchema: z.ZodType<Prisma.PositionDeleteArgs> = z.object({
  select: PositionSelectSchema.optional(),
  where: PositionWhereUniqueInputSchema,
}).strict() ;

export const PositionUpdateArgsSchema: z.ZodType<Prisma.PositionUpdateArgs> = z.object({
  select: PositionSelectSchema.optional(),
  data: z.union([ PositionUpdateInputSchema,PositionUncheckedUpdateInputSchema ]),
  where: PositionWhereUniqueInputSchema,
}).strict() ;

export const PositionUpdateManyArgsSchema: z.ZodType<Prisma.PositionUpdateManyArgs> = z.object({
  data: z.union([ PositionUpdateManyMutationInputSchema,PositionUncheckedUpdateManyInputSchema ]),
  where: PositionWhereInputSchema.optional(),
}).strict() ;

export const PositionDeleteManyArgsSchema: z.ZodType<Prisma.PositionDeleteManyArgs> = z.object({
  where: PositionWhereInputSchema.optional(),
}).strict() ;

export const StrategyConfigCreateArgsSchema: z.ZodType<Prisma.StrategyConfigCreateArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  data: z.union([ StrategyConfigCreateInputSchema,StrategyConfigUncheckedCreateInputSchema ]),
}).strict() ;

export const StrategyConfigUpsertArgsSchema: z.ZodType<Prisma.StrategyConfigUpsertArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  where: StrategyConfigWhereUniqueInputSchema,
  create: z.union([ StrategyConfigCreateInputSchema,StrategyConfigUncheckedCreateInputSchema ]),
  update: z.union([ StrategyConfigUpdateInputSchema,StrategyConfigUncheckedUpdateInputSchema ]),
}).strict() ;

export const StrategyConfigCreateManyArgsSchema: z.ZodType<Prisma.StrategyConfigCreateManyArgs> = z.object({
  data: z.union([ StrategyConfigCreateManyInputSchema,StrategyConfigCreateManyInputSchema.array() ]),
}).strict() ;

export const StrategyConfigCreateManyAndReturnArgsSchema: z.ZodType<Prisma.StrategyConfigCreateManyAndReturnArgs> = z.object({
  data: z.union([ StrategyConfigCreateManyInputSchema,StrategyConfigCreateManyInputSchema.array() ]),
}).strict() ;

export const StrategyConfigDeleteArgsSchema: z.ZodType<Prisma.StrategyConfigDeleteArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  where: StrategyConfigWhereUniqueInputSchema,
}).strict() ;

export const StrategyConfigUpdateArgsSchema: z.ZodType<Prisma.StrategyConfigUpdateArgs> = z.object({
  select: StrategyConfigSelectSchema.optional(),
  data: z.union([ StrategyConfigUpdateInputSchema,StrategyConfigUncheckedUpdateInputSchema ]),
  where: StrategyConfigWhereUniqueInputSchema,
}).strict() ;

export const StrategyConfigUpdateManyArgsSchema: z.ZodType<Prisma.StrategyConfigUpdateManyArgs> = z.object({
  data: z.union([ StrategyConfigUpdateManyMutationInputSchema,StrategyConfigUncheckedUpdateManyInputSchema ]),
  where: StrategyConfigWhereInputSchema.optional(),
}).strict() ;

export const StrategyConfigDeleteManyArgsSchema: z.ZodType<Prisma.StrategyConfigDeleteManyArgs> = z.object({
  where: StrategyConfigWhereInputSchema.optional(),
}).strict() ;

export const RiskConfigCreateArgsSchema: z.ZodType<Prisma.RiskConfigCreateArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  data: z.union([ RiskConfigCreateInputSchema,RiskConfigUncheckedCreateInputSchema ]),
}).strict() ;

export const RiskConfigUpsertArgsSchema: z.ZodType<Prisma.RiskConfigUpsertArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  where: RiskConfigWhereUniqueInputSchema,
  create: z.union([ RiskConfigCreateInputSchema,RiskConfigUncheckedCreateInputSchema ]),
  update: z.union([ RiskConfigUpdateInputSchema,RiskConfigUncheckedUpdateInputSchema ]),
}).strict() ;

export const RiskConfigCreateManyArgsSchema: z.ZodType<Prisma.RiskConfigCreateManyArgs> = z.object({
  data: z.union([ RiskConfigCreateManyInputSchema,RiskConfigCreateManyInputSchema.array() ]),
}).strict() ;

export const RiskConfigCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RiskConfigCreateManyAndReturnArgs> = z.object({
  data: z.union([ RiskConfigCreateManyInputSchema,RiskConfigCreateManyInputSchema.array() ]),
}).strict() ;

export const RiskConfigDeleteArgsSchema: z.ZodType<Prisma.RiskConfigDeleteArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  where: RiskConfigWhereUniqueInputSchema,
}).strict() ;

export const RiskConfigUpdateArgsSchema: z.ZodType<Prisma.RiskConfigUpdateArgs> = z.object({
  select: RiskConfigSelectSchema.optional(),
  data: z.union([ RiskConfigUpdateInputSchema,RiskConfigUncheckedUpdateInputSchema ]),
  where: RiskConfigWhereUniqueInputSchema,
}).strict() ;

export const RiskConfigUpdateManyArgsSchema: z.ZodType<Prisma.RiskConfigUpdateManyArgs> = z.object({
  data: z.union([ RiskConfigUpdateManyMutationInputSchema,RiskConfigUncheckedUpdateManyInputSchema ]),
  where: RiskConfigWhereInputSchema.optional(),
}).strict() ;

export const RiskConfigDeleteManyArgsSchema: z.ZodType<Prisma.RiskConfigDeleteManyArgs> = z.object({
  where: RiskConfigWhereInputSchema.optional(),
}).strict() ;

export const OpportunityLogCreateArgsSchema: z.ZodType<Prisma.OpportunityLogCreateArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  data: z.union([ OpportunityLogCreateInputSchema,OpportunityLogUncheckedCreateInputSchema ]),
}).strict() ;

export const OpportunityLogUpsertArgsSchema: z.ZodType<Prisma.OpportunityLogUpsertArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  where: OpportunityLogWhereUniqueInputSchema,
  create: z.union([ OpportunityLogCreateInputSchema,OpportunityLogUncheckedCreateInputSchema ]),
  update: z.union([ OpportunityLogUpdateInputSchema,OpportunityLogUncheckedUpdateInputSchema ]),
}).strict() ;

export const OpportunityLogCreateManyArgsSchema: z.ZodType<Prisma.OpportunityLogCreateManyArgs> = z.object({
  data: z.union([ OpportunityLogCreateManyInputSchema,OpportunityLogCreateManyInputSchema.array() ]),
}).strict() ;

export const OpportunityLogCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OpportunityLogCreateManyAndReturnArgs> = z.object({
  data: z.union([ OpportunityLogCreateManyInputSchema,OpportunityLogCreateManyInputSchema.array() ]),
}).strict() ;

export const OpportunityLogDeleteArgsSchema: z.ZodType<Prisma.OpportunityLogDeleteArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  where: OpportunityLogWhereUniqueInputSchema,
}).strict() ;

export const OpportunityLogUpdateArgsSchema: z.ZodType<Prisma.OpportunityLogUpdateArgs> = z.object({
  select: OpportunityLogSelectSchema.optional(),
  data: z.union([ OpportunityLogUpdateInputSchema,OpportunityLogUncheckedUpdateInputSchema ]),
  where: OpportunityLogWhereUniqueInputSchema,
}).strict() ;

export const OpportunityLogUpdateManyArgsSchema: z.ZodType<Prisma.OpportunityLogUpdateManyArgs> = z.object({
  data: z.union([ OpportunityLogUpdateManyMutationInputSchema,OpportunityLogUncheckedUpdateManyInputSchema ]),
  where: OpportunityLogWhereInputSchema.optional(),
}).strict() ;

export const OpportunityLogDeleteManyArgsSchema: z.ZodType<Prisma.OpportunityLogDeleteManyArgs> = z.object({
  where: OpportunityLogWhereInputSchema.optional(),
}).strict() ;

export const WeatherForecastCreateArgsSchema: z.ZodType<Prisma.WeatherForecastCreateArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  data: z.union([ WeatherForecastCreateInputSchema,WeatherForecastUncheckedCreateInputSchema ]),
}).strict() ;

export const WeatherForecastUpsertArgsSchema: z.ZodType<Prisma.WeatherForecastUpsertArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  where: WeatherForecastWhereUniqueInputSchema,
  create: z.union([ WeatherForecastCreateInputSchema,WeatherForecastUncheckedCreateInputSchema ]),
  update: z.union([ WeatherForecastUpdateInputSchema,WeatherForecastUncheckedUpdateInputSchema ]),
}).strict() ;

export const WeatherForecastCreateManyArgsSchema: z.ZodType<Prisma.WeatherForecastCreateManyArgs> = z.object({
  data: z.union([ WeatherForecastCreateManyInputSchema,WeatherForecastCreateManyInputSchema.array() ]),
}).strict() ;

export const WeatherForecastCreateManyAndReturnArgsSchema: z.ZodType<Prisma.WeatherForecastCreateManyAndReturnArgs> = z.object({
  data: z.union([ WeatherForecastCreateManyInputSchema,WeatherForecastCreateManyInputSchema.array() ]),
}).strict() ;

export const WeatherForecastDeleteArgsSchema: z.ZodType<Prisma.WeatherForecastDeleteArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  where: WeatherForecastWhereUniqueInputSchema,
}).strict() ;

export const WeatherForecastUpdateArgsSchema: z.ZodType<Prisma.WeatherForecastUpdateArgs> = z.object({
  select: WeatherForecastSelectSchema.optional(),
  data: z.union([ WeatherForecastUpdateInputSchema,WeatherForecastUncheckedUpdateInputSchema ]),
  where: WeatherForecastWhereUniqueInputSchema,
}).strict() ;

export const WeatherForecastUpdateManyArgsSchema: z.ZodType<Prisma.WeatherForecastUpdateManyArgs> = z.object({
  data: z.union([ WeatherForecastUpdateManyMutationInputSchema,WeatherForecastUncheckedUpdateManyInputSchema ]),
  where: WeatherForecastWhereInputSchema.optional(),
}).strict() ;

export const WeatherForecastDeleteManyArgsSchema: z.ZodType<Prisma.WeatherForecastDeleteManyArgs> = z.object({
  where: WeatherForecastWhereInputSchema.optional(),
}).strict() ;

export const WeatherObservationCreateArgsSchema: z.ZodType<Prisma.WeatherObservationCreateArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  data: z.union([ WeatherObservationCreateInputSchema,WeatherObservationUncheckedCreateInputSchema ]),
}).strict() ;

export const WeatherObservationUpsertArgsSchema: z.ZodType<Prisma.WeatherObservationUpsertArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  where: WeatherObservationWhereUniqueInputSchema,
  create: z.union([ WeatherObservationCreateInputSchema,WeatherObservationUncheckedCreateInputSchema ]),
  update: z.union([ WeatherObservationUpdateInputSchema,WeatherObservationUncheckedUpdateInputSchema ]),
}).strict() ;

export const WeatherObservationCreateManyArgsSchema: z.ZodType<Prisma.WeatherObservationCreateManyArgs> = z.object({
  data: z.union([ WeatherObservationCreateManyInputSchema,WeatherObservationCreateManyInputSchema.array() ]),
}).strict() ;

export const WeatherObservationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.WeatherObservationCreateManyAndReturnArgs> = z.object({
  data: z.union([ WeatherObservationCreateManyInputSchema,WeatherObservationCreateManyInputSchema.array() ]),
}).strict() ;

export const WeatherObservationDeleteArgsSchema: z.ZodType<Prisma.WeatherObservationDeleteArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  where: WeatherObservationWhereUniqueInputSchema,
}).strict() ;

export const WeatherObservationUpdateArgsSchema: z.ZodType<Prisma.WeatherObservationUpdateArgs> = z.object({
  select: WeatherObservationSelectSchema.optional(),
  data: z.union([ WeatherObservationUpdateInputSchema,WeatherObservationUncheckedUpdateInputSchema ]),
  where: WeatherObservationWhereUniqueInputSchema,
}).strict() ;

export const WeatherObservationUpdateManyArgsSchema: z.ZodType<Prisma.WeatherObservationUpdateManyArgs> = z.object({
  data: z.union([ WeatherObservationUpdateManyMutationInputSchema,WeatherObservationUncheckedUpdateManyInputSchema ]),
  where: WeatherObservationWhereInputSchema.optional(),
}).strict() ;

export const WeatherObservationDeleteManyArgsSchema: z.ZodType<Prisma.WeatherObservationDeleteManyArgs> = z.object({
  where: WeatherObservationWhereInputSchema.optional(),
}).strict() ;

export const DailyPerformanceCreateArgsSchema: z.ZodType<Prisma.DailyPerformanceCreateArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  data: z.union([ DailyPerformanceCreateInputSchema,DailyPerformanceUncheckedCreateInputSchema ]),
}).strict() ;

export const DailyPerformanceUpsertArgsSchema: z.ZodType<Prisma.DailyPerformanceUpsertArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  where: DailyPerformanceWhereUniqueInputSchema,
  create: z.union([ DailyPerformanceCreateInputSchema,DailyPerformanceUncheckedCreateInputSchema ]),
  update: z.union([ DailyPerformanceUpdateInputSchema,DailyPerformanceUncheckedUpdateInputSchema ]),
}).strict() ;

export const DailyPerformanceCreateManyArgsSchema: z.ZodType<Prisma.DailyPerformanceCreateManyArgs> = z.object({
  data: z.union([ DailyPerformanceCreateManyInputSchema,DailyPerformanceCreateManyInputSchema.array() ]),
}).strict() ;

export const DailyPerformanceCreateManyAndReturnArgsSchema: z.ZodType<Prisma.DailyPerformanceCreateManyAndReturnArgs> = z.object({
  data: z.union([ DailyPerformanceCreateManyInputSchema,DailyPerformanceCreateManyInputSchema.array() ]),
}).strict() ;

export const DailyPerformanceDeleteArgsSchema: z.ZodType<Prisma.DailyPerformanceDeleteArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  where: DailyPerformanceWhereUniqueInputSchema,
}).strict() ;

export const DailyPerformanceUpdateArgsSchema: z.ZodType<Prisma.DailyPerformanceUpdateArgs> = z.object({
  select: DailyPerformanceSelectSchema.optional(),
  data: z.union([ DailyPerformanceUpdateInputSchema,DailyPerformanceUncheckedUpdateInputSchema ]),
  where: DailyPerformanceWhereUniqueInputSchema,
}).strict() ;

export const DailyPerformanceUpdateManyArgsSchema: z.ZodType<Prisma.DailyPerformanceUpdateManyArgs> = z.object({
  data: z.union([ DailyPerformanceUpdateManyMutationInputSchema,DailyPerformanceUncheckedUpdateManyInputSchema ]),
  where: DailyPerformanceWhereInputSchema.optional(),
}).strict() ;

export const DailyPerformanceDeleteManyArgsSchema: z.ZodType<Prisma.DailyPerformanceDeleteManyArgs> = z.object({
  where: DailyPerformanceWhereInputSchema.optional(),
}).strict() ;