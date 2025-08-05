import type { FileApiFlavor, FileFlavor } from '@grammyjs/files'
import type { HydrateApiFlavor, HydrateFlavor } from '@grammyjs/hydrate'
import type { User } from '@prisma/client'
import type { Api, Context, NextFunction, RawApi, SessionFlavor } from 'grammy'
import { autoRetry } from '@grammyjs/auto-retry'
import { type ConversationFlavor, conversations, type StringWithCommandSuggestions } from '@grammyjs/conversations'
import { hydrateFiles } from '@grammyjs/files'
import { hydrateApi, hydrateContext } from '@grammyjs/hydrate'
import { run } from '@grammyjs/runner'
import { PrismaAdapter } from '@grammyjs/storage-prisma'
import { Bot, session } from 'grammy'
import { inject } from 'inversify'
import _ from 'lodash'
import { Service } from '../../common/decorators/service.js'
import logger from '../../common/logger.js'
import { prisma } from '../../common/prisma.js'
import { ENV } from '../../constants/env.js'
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
}

@Service()
export class TGBotService extends Bot<TGBotContext, TGBotApi> {
  private commands = new Map<string, TGCommand>()
  private passUpdates = new Set<string>()

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

    await this.setupCommands()
    return run(this)
  }

  async restart() {
    await this.stop()
    await this.start()
  }

  /**
   * define a command
   * @param params - command parameters
   */
  defineCommand(params: TGCommand) {
    const { command, callback } = params
    this.command(command, callback)
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
