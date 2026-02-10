# Claude Code 项目配置

## 语言偏好

- **交互语言**: 中文
- **代码注释**: 中文
- **文档语言**: 中文
- **Git 提交信息**: 中文

## 项目概述

这是一个基于 TypeScript 的 Polymarket 预测市场交易机器人，实现跨市场套利策略，包含风险管理和 Telegram 通知功能。

## 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.x
- **包管理器**: pnpm
- **数据库**: Prisma ORM
- **Telegram**: Grammy 框架
- **定时任务**: node-cron v4

## 项目结构

```
src/
├── index.ts                 # 应用入口
├── common/                  # 通用工具
├── constants/               # 环境变量、常量
├── locales/                 # 国际化翻译
├── domain/                  # 领域驱动设计层
│   ├── entities/            # 实体：Trade, Position, Opportunity, Market
│   ├── value-objects/       # 值对象：Price, Quantity, Side
│   └── events/              # 领域事件
├── services/                # 外部服务集成
│   ├── pm/                  # Polymarket CLOB 客户端
│   ├── tg/                  # Telegram 机器人
│   └── odds/                # The Odds API 客户端
├── strategies/              # 交易策略
│   ├── base/                # 策略接口与上下文
│   └── arbitrage/           # 套利策略实现
├── risk/                    # 风险管理
├── notifications/           # 通知系统
└── scheduler/               # 定时任务调度器
```

## 开发命令

```bash
pnpm dev          # 开发模式运行
pnpm build        # 构建项目
pnpm start        # 生产模式运行
pnpm lint         # 代码检查
pnpm tsc          # 类型检查
```

## 重要类型说明

### Side 类型

项目中存在两种 Side 类型：

1. `Side`（领域值对象）- `src/domain/value-objects/side.vo.ts`
2. `ClobSide`（@polymarket/clob-client）- 用于 API 调用

下单时需使用 `ClobSide`：

```typescript
import { Side as ClobSide } from '@polymarket/clob-client';
side: ClobSide.BUY;
```

### Market 实体转换

`PMClientService.getMarkets()` 返回 `GammaMarket[]`，需转换为领域实体：

```typescript
const markets = gammaMarkets.map(gm => Market.fromGamma(gm));
```

## 编码规范

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 DDD（领域驱动设计）架构原则
- 使用策略模式实现交易策略
- 使用模板方法模式实现基础策略类
