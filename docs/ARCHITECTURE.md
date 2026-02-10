# Polymarket 套利机器人 - 技术架构文档

## 概述

这是一个基于 TypeScript 的 Polymarket 预测市场交易机器人，实现跨市场套利策略，包含风险管理和 Telegram 通知功能。

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       入口文件 (index.ts)                        │
├─────────────────────────────────────────────────────────────────┤
│     启动引导 → 初始化服务 → 设置策略 → 启动调度器                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    服务层     │       │     策略层      │       │    调度器       │
├───────────────┤       ├─────────────────┤       ├─────────────────┤
│ PMClient      │       │ StrategyContext │       │ CronScheduler   │
│ TGBot         │       │ BaseStrategy    │       │ (node-cron)     │
│ OddsApiClient │       │ PinnacleArb     │       └─────────────────┘
└───────────────┘       └─────────────────┘
        │                         │
        ▼                         ▼
┌───────────────┐       ┌─────────────────┐
│    领域层     │       │    风险管理     │
├───────────────┤       ├─────────────────┤
│ 实体          │       │ RiskManager     │
│ 值对象        │       │ StopLoss        │
│ 领域事件      │       │ TakeProfit      │
└───────────────┘       └─────────────────┘
        │
        ▼
┌───────────────┐
│   通知系统    │
├───────────────┤
│ 处理器        │
│ 格式化器      │
└───────────────┘
```

## 目录结构

```
src/
├── index.ts                 # 应用入口
├── common/                  # 通用工具（日志等）
├── constants/               # 环境变量、常量
├── locales/                 # 国际化翻译
├── domain/                  # 领域驱动设计层
│   ├── entities/            # 实体：Trade, Position, Opportunity, Market
│   ├── value-objects/       # 值对象：Price, Quantity, TokenId
│   └── events/              # 领域事件
├── services/                # 外部服务集成
│   ├── pm/                  # Polymarket CLOB 客户端
│   ├── tg/                  # Telegram 机器人及命令
│   └── odds/                # The Odds API 客户端
├── strategies/              # 交易策略
│   ├── base/                # 策略接口与上下文
│   └── arbitrage/           # 套利策略实现
├── risk/                    # 风险管理
├── notifications/           # 通知系统
│   ├── handlers/            # 交易、机会、风险处理器
│   └── formatters/          # 消息格式化器
└── scheduler/               # 定时任务调度器
```

## 核心组件

### 1. 服务层

#### PMClientService (`src/services/pm/client.service.ts`)

Polymarket CLOB API 客户端封装：

- 订单下单（市价/限价）
- 仓位管理
- 余额查询
- 市场数据获取

#### OddsApiClient (`src/services/odds/odds-api.client.ts`)

The Odds API 集成，用于获取体育博彩赔率：

- 从多个博彩公司获取赔率
- 筛选 Pinnacle（尖子博彩）赔率
- 计算公平概率

#### TGBotService (`src/services/tg/`)

Telegram 机器人，用于通知和命令：

- Grammy 框架
- 命令注册
- Webhook/轮询支持

### 2. 领域层

#### 实体

- **Trade**: 已执行的交易，包含入场/出场价格、盈亏
- **Position**: 当前市场仓位，包含数量、入场价格
- **Opportunity**: 已识别的交易机会
- **Market**: Polymarket 市场数据

#### 值对象

- **Price**: 不可变的价格值（PM 范围 0-1）
- **Quantity**: 带验证的交易数量
- **TokenId**: 代币标识符

#### 领域事件

- `TradeExecutedEvent` - 交易执行事件
- `PositionOpenedEvent` - 仓位开启事件
- `PositionClosedEvent` - 仓位关闭事件
- `OpportunityFoundEvent` - 机会发现事件

### 3. 策略层

#### IStrategy 接口

```typescript
interface IStrategy {
  name: string;
  enabled: boolean;
  type: string;

  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;

  scan(): Promise<Opportunity[]>;
  execute(opportunity: Opportunity): Promise<TradeResult>;
  run(): Promise<void>;

  getConfig(): StrategyConfig;
  updateConfig(config: Partial<StrategyConfig>): void;
  getStats(): StrategyStats;
}
```

#### StrategyContext

策略上下文，管理多个策略：

- 注册/注销策略
- 启动/停止所有策略
- 并行运行所有策略
- 聚合统计数据

#### PinnacleArbitrageStrategy

使用 Pinnacle 作为尖子参考的跨市场价值套利策略。

### 4. 风险管理

#### RiskManagerService

中央风险控制：

- 仓位大小限制
- 总敞口限制
- 回撤监控
- 每日亏损限制

#### StopLossHandler

止损实现：

- 固定价格止损
- 百分比止损
- 追踪止损

#### TakeProfitHandler

止盈实现：

- 固定价格目标
- 百分比目标
- 部分止盈

### 5. 通知系统

#### NotificationService

通过处理器编排通知：

- 交易通知
- 机会提醒
- 风险警告
- 每日报告

#### 消息格式化器

Telegram 优化格式：

- Markdown 支持
- 表情符号指示器
- 结构化布局

### 6. 调度器

#### CronSchedulerService

基于 node-cron 的任务调度器：

- 机会扫描（每 10 秒）
- 风险监控（每 30 秒）
- 每日报告（UTC 午夜）

## Pinnacle 套利策略

### 数学基础

该策略使用**乘法归一化**从 Pinnacle 赔率计算公平概率。

#### 步骤 1：计算隐含概率

```
IP_i = 1 / O_i
```

其中 `O_i` 是结果 `i` 的小数赔率。

#### 步骤 2：计算总超额赔率

```
S = Σ IP_i
```

所有隐含概率之和（由于博彩公司利润，通常 > 1）。

#### 步骤 3：计算公平概率

```
FP_i = IP_i / S
```

归一化概率，总和为 1。

### 边缘计算

```
Edge = Pinnacle 公平概率 - Polymarket 价格
```

如果 `Edge >= minEdge`（例如 3%），则标记为执行机会。

### 期望值

```
EV = (公平概率 / PM 价格) - 1
```

正 EV 表示长期盈利机会。

### 仓位大小（凯利公式）

```
凯利分数 = (p * b - q) / b
```

其中：

- `p` = 获胜概率（公平概率）
- `q` = 1 - p（失败概率）
- `b` = 赔率 (1/price - 1)

策略使用分数凯利（通常 25-50%）以保守定位。

## 配置

### 环境变量

```env
# Telegram
TELEGRAM_BOT_TOKEN=          # BotFather 获取的 Bot Token
TELEGRAM_ADMIN_CHAT_ID=      # 管理员聊天 ID，用于通知
TELEGRAM_USE_WEBHOOK=false   # 使用 webhook 还是轮询

# Polymarket
PRIVATE_KEY=                 # 以太坊私钥
PM_API_KEY=                  # Polymarket API Key
PM_API_SECRET=               # Polymarket API Secret
PM_API_PASSPHRASE=           # Polymarket API Passphrase

# The Odds API
ODDS_API_KEY=                # the-odds-api.com 的 API Key

# 可选
SOCKS_PROXY_HOST=            # 代理主机
SOCKS_PROXY_PORT=            # 代理端口
LOGGER_DIR_PATH=./           # 日志文件目录
```

### 策略配置

```typescript
const pinnacleConfig: PinnacleArbitrageConfig = {
  enabled: true,
  oddsApiKey: 'xxx',
  minEdge: 0.03, // 最小边缘 3%
  sports: ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb'],
  confidenceThreshold: 0.6,
  maxPositionSize: 500,
  maxConcurrentTrades: 3,
  maxDailyTrades: 20
};
```

### 风险配置

```typescript
const riskConfig = {
  maxPositionSize: 1000, // 单仓位最大值
  maxTotalExposure: 10000, // 总敞口最大值
  maxDrawdownPercent: 10, // 最大回撤百分比
  maxPositions: 10, // 最大并发仓位数
  dailyLossLimit: 500 // 每日亏损限制
};
```

## Telegram 命令

| 命令           | 描述             |
| -------------- | ---------------- |
| `/positions`   | 查看当前仓位     |
| `/orders`      | 查看待成交订单   |
| `/cancel <id>` | 取消指定订单     |
| `/cancelall`   | 取消所有订单     |
| `/balance`     | 查看账户余额     |
| `/pnl`         | 查看盈亏摘要     |
| `/strategies`  | 列出策略和统计   |
| `/risk`        | 查看风险指标     |
| `/status`      | 系统状态概览     |

## 定时任务

| 任务               | 调度周期  | 描述                 |
| ------------------ | --------- | -------------------- |
| `opportunity-scan` | 每 10 秒  | 扫描套利机会         |
| `risk-monitor`     | 每 30 秒  | 监控风险指标         |
| `daily-report`     | 00:00 UTC | 发送每日业绩报告     |

## 数据流

```
1. 调度器触发 opportunity-scan
        │
        ▼
2. StrategyContext.runAll()
        │
        ▼
3. PinnacleStrategy.scan()
   ├── 从 The Odds API 获取 Pinnacle 赔率
   ├── 获取 PM 市场价格
   ├── 计算公平概率
   └── 识别边缘机会
        │
        ▼
4. RiskManager.checkTrade()
   ├── 仓位大小检查
   ├── 敞口检查
   └── 回撤检查
        │
        ▼
5. PinnacleStrategy.execute()
   └── PMClient.placeOrder()
        │
        ▼
6. NotificationService.notify()
   └── TGBot 发送交易通知
```

## 错误处理

- SIGINT/SIGTERM 优雅关闭
- 未处理异常日志记录
- 策略级错误隔离
- 关键错误通知

## 部署

### 开发环境

```bash
pnpm install
pnpm dev
```

### 生产环境

```bash
pnpm build
pnpm start
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
CMD ["node", "dist/index.js"]
```

## 依赖

### 核心依赖

- `@polymarket/clob-client` - Polymarket API
- `grammy` - Telegram 机器人框架
- `prisma` - 数据库 ORM
- `node-cron` (v4.x) - 任务调度
- `axios` - HTTP 客户端

### 开发依赖

- `typescript` - 类型安全
- `tsx` - TypeScript 执行
- `eslint` - 代码检查

## 类型系统说明

### Side 类型

项目中存在两种 `Side` 类型：

1. **领域 Side** (`src/domain/value-objects/side.vo.ts`) - 内部领域值对象
2. **ClobSide** (`@polymarket/clob-client`) - Polymarket API 调用所需

下单时需导入并使用 Polymarket 客户端的 Side 枚举：

```typescript
import { Side as ClobSide } from '@polymarket/clob-client';

await pmClient.createLimitOrder({
  tokenId: '...',
  price: 0.5,
  size: 100,
  side: ClobSide.BUY
});
```

### Market 实体转换

`PMClientService.getMarkets()` 返回 Gamma API 的 `GammaMarket[]`。
使用工厂方法转换为领域 `Market` 实体：

```typescript
const gammaMarkets = await pmClient.getMarkets({ active: true });
const markets = gammaMarkets.map(gm => Market.fromGamma(gm));
```

### node-cron v4 选项

调度器使用 node-cron v4，与 v3 选项不同：

```typescript
// v4 TaskOptions
{
  timezone?: string
  name?: string
  noOverlap?: boolean
  maxExecutions?: number
  maxRandomDelay?: number
}
```

注意：v3 的 `scheduled` 选项在 v4 中不可用。

## API 参考

### The Odds API 体育键值

常用配置的体育键值：

- `americanfootball_nfl` - NFL 美式橄榄球
- `basketball_nba` - NBA 篮球
- `baseball_mlb` - MLB 棒球
- `icehockey_nhl` - NHL 冰球
- `soccer_epl` - 英超足球
- `mma_ufc` - UFC 综合格斗

### Polymarket 价格范围

- 价格表示为概率：0.01 到 0.99
- YES + NO 价格通常接近 1.0
- 当总和 < 1.0 时存在套利机会
