<div align="center">

# grammy-esm-server-template

<a href="https://github.com/Siykt/grammy-esm-server-template/blob/main/README.zh-CN.md">中文文档</a>
·
<a href="https://github.com/Siykt/grammy-esm-server-template/blob/main/README.md">Documents</a>

</div>

一个现代化的 Telegram Bot 服务器模板，基于 [grammY](https://grammy.dev/) 框架，采用 ESM 架构，集成了常用插件，支持 Prisma ORM 与 Zod 数据验证，并内置依赖注入（DI）能力，助力高效开发可维护的 Telegram Bot 项目。

## 特性

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
