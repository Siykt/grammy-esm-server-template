import type { FileApiFlavor, FileFlavor } from '@grammyjs/files'
import type { HydrateApiFlavor, HydrateFlavor } from '@grammyjs/hydrate'
import type { Api, Context, NextFunction, RawApi } from 'grammy'
import { autoRetry } from '@grammyjs/auto-retry'
import { type ConversationFlavor, conversations, type StringWithCommandSuggestions } from '@grammyjs/conversations'
import { hydrateFiles } from '@grammyjs/files'
import { hydrateApi, hydrateContext } from '@grammyjs/hydrate'
import { Bot } from 'grammy'
import { inject } from 'inversify'
import { Service } from '../../common/decorators/service.js'
import { isDev } from '../../common/is.js'
import logger from '../../common/logger.js'
import { ENV } from '../../constants/env.js'
import { UserService } from '../user/user.service.js'

export type TGBotContext = FileFlavor<HydrateFlavor<ConversationFlavor<Context>>>

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
}

@Service()
export class TGBotService extends Bot<TGBotContext, TGBotApi> {
  private commands = new Map<string, TGCommand>()

  constructor(
    @inject(UserService)
    private readonly userService: UserService,
  ) {
    super(ENV.TELEGRAM_BOT_TOKEN)

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

  override async start() {
    if (isDev()) {
      this.on('message', (ctx, next) => {
        logger.debug(`[TGM] @${ctx.message?.chat.username}_${ctx.message?.chat.id}: ${ctx.message?.text}`)

        // if you want to let all the middleware after this one to be executed, you need to call next()
        next()
      })
    }

    this.defineCommand({
      command: 'start',
      description: 'Start!',
      callback: async (ctx) => {
        logger.debug(`[TGM] @${ctx.message?.chat.username}_${ctx.message?.chat.id}: start command`)
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

    this.defineCommand({
      command: 'help',
      description: 'Help!',
      callback: (ctx) => {
        logger.debug(`[TGM] @${ctx.message?.chat.username}_${ctx.message?.chat.id}: help command`)
        ctx.reply('Help!')
      },
    })

    await this.setupCommands()
    await super.start()
  }

  async restart() {
    await this.stop()
    await this.start()
  }

  defineCommand(params: TGCommand) {
    const { command, callback } = params
    this.command(command, callback)
    this.commands.set(command, params)
  }

  setupCommands() {
    return this.api.setMyCommands(Array.from(this.commands.values())
      .filter(({ register }) => register !== false)
      .map(({ command, description }) => ({ command, description })))
  }
}
