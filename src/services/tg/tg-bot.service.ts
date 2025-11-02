import type { FileApiFlavor, FileFlavor } from '@grammyjs/files'
import type { HydrateApiFlavor, HydrateFlavor } from '@grammyjs/hydrate'
import type { MenuOptions } from '@grammyjs/menu'
import type { User } from '@prisma/client'
import type { Api, Context, NextFunction, RawApi, SessionFlavor } from 'grammy'
import { autoRetry } from '@grammyjs/auto-retry'
import { type ConversationFlavor, conversations, type StringWithCommandSuggestions } from '@grammyjs/conversations'
import { hydrateFiles } from '@grammyjs/files'
import { hydrateApi, hydrateContext } from '@grammyjs/hydrate'
import { Menu } from '@grammyjs/menu'
import { run } from '@grammyjs/runner'
import { PrismaAdapter } from '@grammyjs/storage-prisma'
import { Bot, session } from 'grammy'
import { inject } from 'inversify'
import _ from 'lodash'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { Service } from '../../common/decorators/service.js'
import logger from '../../common/logger.js'
import { prisma } from '../../common/prisma.js'
import { ENV } from '../../constants/env.js'
import { PairService } from '../exchange/pair.service.js'
import { UserService } from '../user/user.service.js'

export type TGBotUser = User

export interface TGBotSessionData {
  user: TGBotUser
}

export type TGBotContext = FileFlavor<HydrateFlavor<ConversationFlavor<Context>>> & SessionFlavor<TGBotSessionData>

export type TGBotApi = FileApiFlavor<HydrateApiFlavor<Api>>

export type TGBotMethods<R extends RawApi> = string & keyof R

// eslint-disable-next-line ts/no-empty-object-type, ts/no-explicit-any
export type TGBotPayload<M extends TGBotMethods<R>, R extends RawApi> = M extends unknown ? R[M] extends (signal?: AbortSignal) => unknown ? {} : R[M] extends (args: any, signal?: AbortSignal) => unknown ? Parameters<R[M]>[0] : never : never

export type TGBotApiOther<R extends RawApi, M extends TGBotMethods<R>, X extends string = never> = Omit<TGBotPayload<M, R>, X>

export type TGBotOther<M extends TGBotMethods<RawApi>, X extends string = never> = TGBotApiOther<RawApi, M, X>

export interface TGCommand {
  command: StringWithCommandSuggestions
  description: string
  callback: (ctx: TGBotContext, next: NextFunction) => unknown
  register?: boolean
  privite?: boolean
}

@Service()
export class TGBotService extends Bot<TGBotContext, TGBotApi> {
  private commands = new Map<string, TGCommand>()
  private passUpdates = new Set<string>()

  constructor(
    @inject(UserService)
    private readonly userService: UserService,
    @inject(PairService)
    private readonly pairService: PairService,
  ) {
    let socksAgent: SocksProxyAgent | undefined
    if (ENV.SOCKS_PROXY_HOST && ENV.SOCKS_PROXY_PORT) {
      socksAgent = new SocksProxyAgent(`socks5://${ENV.SOCKS_PROXY_HOST}:${ENV.SOCKS_PROXY_PORT}`)
    }

    super(ENV.TELEGRAM_BOT_TOKEN, {
      client: {
        baseFetchConfig: {
          agent: socksAgent,
          compress: true,
        },
      },
    })

    this.use(hydrateContext())
    this.use(conversations())

    this.api.config.use(hydrateFiles(this.token))
    this.api.config.use(hydrateApi())
    this.api.config.use(autoRetry({
      maxRetryAttempts: 1,
      maxDelaySeconds: 5,
      rethrowInternalServerErrors: false,
      rethrowHttpErrors: false,
    }))
  }

  private defineStartCommand() {
    this.defineCommand({
      command: 'start',
      description: 'Start!',
      callback: async (ctx) => {
        logger.debug(`[TGBotService] @${ctx.message?.chat.username}_${ctx.message?.chat.id}: start command`)
        const user = await this.userService.createIfNotExists({
          telegramId: ctx.message?.chat.id.toString() ?? '',
          username: ctx.message?.chat.username ?? '',
          firstName: ctx.message?.chat.first_name ?? '',
          lastName: ctx.message?.chat.last_name ?? '',
        })
        const message = await ctx.reply(`Hello, @${user.username}!`)
        await message.react('🥰')
      },
    })
  }

  private defineHelpCommand() {
    this.defineCommand({
      command: 'help',
      description: 'Help!',
      callback: (ctx) => {
        logger.debug(`[TGBotService] @${ctx.message?.chat.username}_${ctx.message?.chat.id}: help command`)
        ctx.reply('Help!')
      },
    })
  }

  private isAdmin(ctx: TGBotContext): boolean {
    const id = ctx.chatId?.toString()
    return !!id && ENV.ADMIN_TG_IDS.includes(id)
  }

  private definePairCommands() {
    // /pair_add BTC/USDT [notes]
    this.defineCommand({
      command: 'pair_add',
      description: '添加交易对: /pair_add BTC/USDT [notes]',
      callback: async (ctx) => {
        if (!this.isAdmin(ctx))
          return ctx.reply('权限不足')
        const text = ctx.message?.text ?? ''
        const args = text.split(' ').slice(1)
        const symbol = args[0]
        const notes = args.slice(1).join(' ') || undefined
        if (!symbol)
          return ctx.reply('用法: /pair_add BTC/USDT [notes]')
        try {
          const row = await this.pairService.create({ symbol, notes, addedByTg: ctx.chatId?.toString() })
          return ctx.reply(`已添加: ${row.symbol} (id=${row.id})`)
        }
        catch (e) {
          return ctx.reply(`添加失败: ${(e as Error).message}`)
        }
      },
    })

    // /pair_list [enabled]
    this.defineCommand({
      command: 'pair_list',
      description: '列出交易对: /pair_list [enabled]',
      callback: async (ctx) => {
        if (!this.isAdmin(ctx))
          return ctx.reply('权限不足')
        const arg = (ctx.message?.text ?? '').split(' ')[1]
        const enabled = arg === undefined ? undefined : arg === 'true'
        const list = await this.pairService.list({ enabled })
        if (!list.length)
          return ctx.reply('暂无交易对')
        const msg = list.map(p => `${p.enabled ? '✅' : '❌'} ${p.symbol} (${p.isLinear ? 'U' : '币'}本位) id=${p.id}${p.notes ? ` | ${p.notes}` : ''}`).join('\n')
        return ctx.reply(msg)
      },
    })

    // /pair_edit <id> [enable|disable] [symbol <newSymbol>] [notes <text|null>]
    this.defineCommand({
      command: 'pair_edit',
      description: '编辑交易对: /pair_edit <id> ...',
      callback: async (ctx) => {
        if (!this.isAdmin(ctx))
          return ctx.reply('权限不足')
        const parts = (ctx.message?.text ?? '').split(' ')
        const id = parts[1]
        if (!id)
          return ctx.reply('用法: /pair_edit <id> [enable|disable] [symbol <newSymbol>] [notes <text|null>]')
        let enabled: boolean | undefined
        let symbol: string | undefined
        let notes: string | null | undefined
        for (let i = 2; i < parts.length; i++) {
          const t = parts[i]
          if (t === 'enable') {
            enabled = true
          }
          else if (t === 'disable') {
            enabled = false
          }
          else if (t === 'symbol') {
            symbol = parts[++i]
          }
          else if (t === 'notes') {
            const n = parts[++i]
            notes = n === 'null' ? null : (n ?? '')
          }
        }
        try {
          const row = await this.pairService.update({ id, enabled, symbol, notes })
          return ctx.reply(`已更新: ${row.symbol} (${row.enabled ? 'enabled' : 'disabled'})`)
        }
        catch (e) {
          return ctx.reply(`更新失败: ${(e as Error).message}`)
        }
      },
    })

    // /pair_remove <id>
    this.defineCommand({
      command: 'pair_remove',
      description: '删除交易对: /pair_remove <id>',
      callback: async (ctx) => {
        if (!this.isAdmin(ctx))
          return ctx.reply('权限不足')
        const id = (ctx.message?.text ?? '').split(' ')[1]
        if (!id)
          return ctx.reply('用法: /pair_remove <id>')
        try {
          await this.pairService.remove(id)
          return ctx.reply('已删除')
        }
        catch (e) {
          return ctx.reply(`删除失败: ${(e as Error).message}`)
        }
      },
    })
  }

  private registerSession() {
    this.use(session({
      initial: () => ({ user: {} as TGBotUser }),
      storage: new PrismaAdapter(prisma.telegramMessageSession),
    }))

    this.use(async (ctx, next) => {
      logger.debug(`[TGBotService] @${ctx.message?.chat.username}_${ctx.message?.chat.id}: ${ctx.message?.text}`)
      const telegramId = ctx.chatId?.toString()
      if (!telegramId) {
        return next()
      }

      const isPass = this.passUpdates.has(telegramId)
      logger.debug(`[TGBotService] isPass: ${isPass}`)

      // if user is not set, or is not passed, then create a new user
      // if user is set to skip updates, then do not update user
      if (_.isEmpty(ctx.session.user) || !isPass) {
        const user = await this.userService.createIfNotExists({
          telegramId,
          firstName: ctx.from?.first_name ?? '',
          lastName: ctx.from?.last_name ?? '',
          username: ctx.from?.username ?? '',
        })

        ctx.session.user = user

        // after update, set user to skip updates, to avoid frequent database access
        this.passUpdates.add(telegramId)
      }
      await next()
    })

    logger.info('[TGBotService] Register session success')
  }

  async run() {
    this.registerSession()
    this.defineStartCommand()
    this.defineHelpCommand()
    this.definePairCommands()

    await this.setupCommands()
    return run(this)
  }

  /**
   * Create a menu
   *
   * If two menus have a dependency relationship(submenu),
   * you must use `menu.register()` to register them in the bot.
   * Otherwise, the menu will not take effect and an error will be reported:
   * `Cannot send menu ${id}! Did you forget to use bot.use() for it or try to send it through bot.api?`
   * @param id - menu id
   * @param options - menu options
   * @returns the menu
   */
  createMenu(id: string, options?: MenuOptions<TGBotContext>) {
    return new Menu<TGBotContext>(id, options)
  }

  /**
   * define a command
   * @param params - command parameters
   */
  defineCommand(params: TGCommand) {
    const { command, callback } = params
    if (params.privite) {
      this.on('message').filter(ctx => ctx.msg.chat.type === 'private').command(command, callback)
    }
    else {
      this.command(command, callback)
    }
    this.commands.set(command, params)
  }

  /**
   * setup commands
   */
  setupCommands() {
    return this.api.setMyCommands(Array.from(this.commands.values())
      .filter(({ register }) => register !== false)
      .map(({ command, description }) => ({ command, description })))
  }

  /**
   * dispatch a command
   * @param ctx - context
   * @param next - next function
   * @param command - command
   */
  dispatchCommand(ctx: TGBotContext, next: NextFunction, command: string) {
    const commandObj = this.commands.get(command)
    if (!commandObj) {
      return next()
    }
    return commandObj.callback(ctx, next)
  }

  /**
   * update session
   * @param ctx - context
   * @param newSession - new session data
   */
  updateSession(ctx: TGBotContext, newSession: Partial<TGBotSessionData>) {
    logger.debug(`[TGBotService] updateSession: ${JSON.stringify(newSession, null, 2)}`)
    // directly assign to ctx.session, trigger Grammy's reactive mechanism(Object.defineProperty)
    ctx.session = {
      ...ctx.session,
      ...newSession,
    }
  }

  /**
   * force update session data when next message is received
   * @param telegramId - user id
   */
  forceUpdateSession(telegramId: string) {
    if (!telegramId || !this.passUpdates.has(telegramId)) {
      logger.warn(`[TGBotService] forceUpdateSession: telegramId ${telegramId} not found in passUpdates`)
      return
    }
    this.passUpdates.delete(telegramId)
  }

  /**
   * generate start link
   * @param type - the type of the start link
   * @param params - the params of the start link
   * @returns the start link
   */
  generateStartLink(type: string, ...params: string[]) {
    if (type.includes('_')) {
      throw new Error('type cannot contain underscore')
    }

    const startParamString = `${type}_${params.join('_')}`

    if (startParamString.length > 256)
      throw new Error('start param string is too long')

    return `https://t.me/${this.botInfo.username}?start=${startParamString}`
  }

  /**
   * parse start param
   * @param startParamString - the start param string
   * @returns the type and params
   */
  parserStartParam<T extends string[] = []>(startParamString: string) {
    const [type, ...params] = startParamString.split('_')

    if (!type)
      throw new Error('No type found')

    return { type, params: params as T }
  }
}
