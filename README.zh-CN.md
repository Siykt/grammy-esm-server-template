<div align="center">

# grammy-esm-server-template

<a href="https://github.com/Siykt/grammy-esm-server-template/blob/main/README.zh-CN.md">中文文档</a>
·
<a href="https://github.com/Siykt/grammy-esm-server-template/blob/main/README.md">Documents</a>

</div>

一个现代化的 Telegram Bot 服务器模板，基于 [grammY](https://grammy.dev/) 框架，采用 ESM 架构，集成了常用插件，支持 Prisma ORM 与 Zod 数据验证，并内置依赖注入（DI）能力，助力高效开发可维护的 Telegram Bot 项目。

## 特性

- 🚀 **现代化 grammY 框架**：基于 grammY 构建，享受极简、强大、类型安全的 tgbot 开发体验。
- 🔌 **常用插件集成**：内置常用 grammY 插件，开箱即用。
- 🗄️ **Prisma ORM 支持**：轻松对接数据库，类型安全，迁移便捷。
- 🛡️ **Zod 验证**：集成 Zod 进行参数与数据结构校验，保障数据安全。
- 🧩 **依赖注入（DI）**：模块化设计，便于扩展与测试。
- 📦 **ESM 支持**：采用原生 ESM 语法，拥抱未来。

## 快速开始

1. 使用 GitHub Template 创建属于你自己的仓库：
   [使用此模板](https://github.com/Siykt/grammy-esm-server-template/generate)
2. 配置 `.env` 文件，设置 Telegram Bot Token 及数据库连接等信息。
3. 安装依赖：
   ```bash
   pnpm install
   ```
4. 启动开发环境：
   ```bash
   pnpm dev
   ```

## 文档与更多

- [grammY 中文文档](https://grammy.dev/zh/)
- [Prisma 官方文档（英文）](https://www.prisma.io/docs)
 
## 技术栈

- **运行时**：Node.js >= 18，ESM
- **语言**：TypeScript 5
- **框架**：grammY
  - 插件：`@grammyjs/auto-retry`、`@grammyjs/conversations`、`@grammyjs/files`、`@grammyjs/hydrate`、`@grammyjs/menu`、`@grammyjs/runner`、`@grammyjs/storage-prisma`
- **ORM**：Prisma（`@prisma/client`），默认使用 SQLite
- **校验**：Zod + `zod-prisma-types`
- **依赖注入**：Inversify + 装饰器/元数据
- **构建**：tsup（ESM 输出），开发使用 `tsx`
- **日志**：winston
- **其它**：dotenv、lodash、nanoid、socks-proxy-agent
- **TON**：`@ton/core`、`@tonconnect/sdk`、`@atp-tools/lib`

## 目录结构

```text
.
├── src
│   ├── index.ts
│   ├── common/
│   ├── constants/
│   ├── services/
│   │   ├── tg/
│   │   ├── user/
│   │   └── web3/
│   └── @types/
├── prisma
│   ├── schema.prisma
│   └── generated/zod/
├── tsconfig.json
├── tsup.config.ts
├── eslint.config.js
└── README.md
```

## 环境变量

在项目根目录创建 `.env` 文件。

```ini
# 必填
TELEGRAM_BOT_TOKEN=xxxxxx

# 数据库（Prisma）。SQLite 示例
DATABASE_URL="file:./database/database.db"

# 可选
NODE_ENV=development
LOGGER_DIR_PATH=./
TELEGRAM_USE_WEBHOOK=false

# TON 相关（可选）
TON_CENTER_API_KEY=
TON_WALLETS_APP_MANIFEST_URL=

# Telegram 网络代理（可选）
SOCKS_PROXY_HOST=
SOCKS_PROXY_PORT=
```

说明：
- 默认数据库为 SQLite（见 `prisma/schema.prisma`）。可按需修改 provider 与 `DATABASE_URL`。
- `LOGGER_DIR_PATH` 控制 winston 日志文件写入目录。
- TON 能力为可选，如不使用可不配置相关变量。

## 脚本

- `pnpm dev`：开发模式，热更新
- `pnpm build`：使用 tsup 构建（ESM）
- `pnpm start`：运行 `dist/` 产物
- `pnpm lint`：对 `src` 进行 Lint 并自动修复
- `postinstall`：`prisma generate`（生成 Prisma Client 和 Zod 类型）

## 开发流程

1. 安装依赖：`pnpm install`
2. 配置 `.env`（见上）
3. 初始化数据库（以 SQLite 为例）：
   - 生成客户端：`pnpm install`（自动执行 `prisma generate`）
   - 创建表结构：`npx prisma migrate dev --name init`
4. 运行：`pnpm dev`

## 部署

- `.github/workflows/deploy.yml` 提供了示例工作流，支持构建 Docker 镜像并通过 SSH 部署到服务器。请根据实际基础设施调整环境变量、Secrets 与运行参数。
- 容器最小环境变量建议：`TELEGRAM_BOT_TOKEN`、`DATABASE_URL`、`LOGGER_DIR_PATH`，以及按需的 TON 与代理配置。

## 许可证

MIT