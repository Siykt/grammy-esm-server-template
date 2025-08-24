<div align="center">

# grammy-esm-server-template

<a href="https://github.com/Siykt/grammy-esm-server-template/blob/main/README.zh-CN.md">中文文档</a>
·
<a href="https://github.com/Siykt/grammy-esm-server-template/blob/main/README.md">Documents</a>

</div>

A modern Telegram Bot server template based on the [grammY](https://grammy.dev/) framework, using ESM architecture, integrated with popular plugins, supporting Prisma ORM and Zod validation, and built-in Dependency Injection (DI) for efficient and maintainable Telegram Bot development.

## Features

- 🚀 **Modern grammY Framework**: Built with grammY for a minimal, powerful, and type-safe tgbot development experience.
- 🔌 **Popular Plugin Integration**: Comes with essential grammY plugins out of the box.
- 🗄️ **Prisma ORM Support**: Easy database integration with type safety and convenient migrations.
- 🛡️ **Zod Validation**: Integrated Zod for parameter and data structure validation, ensuring data safety.
- 🧩 **Dependency Injection (DI)**: Modular design for easy extension and testing.
- 📦 **ESM Support**: Uses native ESM syntax for future-proof development.

## Quick Start

1. Use the GitHub Template to create your own repository:
   [Use this template](https://github.com/Siykt/grammy-esm-server-template/generate)
2. Configure the `.env` file with your Telegram Bot Token and database connection info.
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

## Documentation & More

- [grammY Documentation](https://grammy.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
 
## Tech Stack

- **Runtime**: Node.js >= 18, ESM
- **Language**: TypeScript 5
- **Framework**: grammY
  - Plugins: `@grammyjs/auto-retry`, `@grammyjs/conversations`, `@grammyjs/files`, `@grammyjs/hydrate`, `@grammyjs/menu`, `@grammyjs/runner`, `@grammyjs/storage-prisma`
- **ORM**: Prisma (`@prisma/client`), SQLite by default
- **Validation**: Zod + `zod-prisma-types`
- **DI**: Inversify + experimental decorators/metadata
- **Build**: tsup (ESM output), dev runner `tsx`
- **Logging**: winston
- **Other**: dotenv, lodash, nanoid, socks-proxy-agent
- **TON**: `@ton/core`, `@tonconnect/sdk`, `@atp-tools/lib`

## Project Structure

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

## Environment Variables

Create a `.env` file in the project root.

```ini
# Required
TELEGRAM_BOT_TOKEN=xxxxxx

# Database (Prisma). SQLite example
DATABASE_URL="file:./database/database.db"

# Optional
NODE_ENV=development
LOGGER_DIR_PATH=./
TELEGRAM_USE_WEBHOOK=false

# TON integrations (optional)
TON_CENTER_API_KEY=
TON_WALLETS_APP_MANIFEST_URL=

# SOCKS proxy for Telegram (optional)
SOCKS_PROXY_HOST=
SOCKS_PROXY_PORT=
```

Notes:
- Default database provider is SQLite (`prisma/schema.prisma`). You can switch providers by editing `schema.prisma` and `DATABASE_URL`.
- `LOGGER_DIR_PATH` controls winston log file location.
- TON features are optional; only set related variables if you use them.

## Scripts

- `pnpm dev`: Start dev server with hot reload
- `pnpm build`: Build with tsup (ESM)
- `pnpm start`: Run built files from `dist/`
- `pnpm lint`: Lint and auto-fix `src`
- `postinstall`: `prisma generate` (generate Prisma Client and Zod types)

## Development

1. Install deps: `pnpm install`
2. Configure `.env` (see above)
3. Initialize database (SQLite example):
   - Generate client: `pnpm install` (runs `prisma generate`)
   - Create tables: `npx prisma migrate dev --name init`
4. Run: `pnpm dev`

## Deployment

- A sample GitHub Actions workflow is provided at `.github/workflows/deploy.yml` to build a Docker image and deploy via SSH. Adjust environment variables, secrets, and runtime flags for your infrastructure.
- Minimal container envs to consider: `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, `LOGGER_DIR_PATH`, optional TON and proxy vars.

## License

MIT