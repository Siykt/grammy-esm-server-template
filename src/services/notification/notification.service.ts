import { inject } from 'inversify'
import { Service } from '../../common/decorators/service.js'
import logger from '../../common/logger.js'
import { prisma } from '../../common/prisma.js'
import { ENV } from '../../constants/env.js'
import { TGBotService } from '../tg/tg-bot.service.js'

export enum NotificationLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum NotificationChannel {
  TELEGRAM = 'TELEGRAM',
  LOG = 'LOG',
  CONSOLE = 'CONSOLE',
}

export interface SendNotificationParams {
  level: NotificationLevel
  title?: string
  message: string
  channels?: NotificationChannel[]
  telegramIds?: string[]
  meta?: Record<string, unknown>
}

@Service()
export class NotificationService {
  constructor(
    @inject(TGBotService)
    private readonly tg: TGBotService,
  ) {}

  async info(params: Omit<SendNotificationParams, 'level'>) {
    return this.notify({ ...params, level: NotificationLevel.INFO })
  }

  async warn(params: Omit<SendNotificationParams, 'level'>) {
    return this.notify({ ...params, level: NotificationLevel.WARN })
  }

  async error(params: Omit<SendNotificationParams, 'level'>) {
    return this.notify({ ...params, level: NotificationLevel.ERROR })
  }

  async critical(params: Omit<SendNotificationParams, 'level'>) {
    return this.notify({ ...params, level: NotificationLevel.CRITICAL })
  }

  /**
   * 发送通知（支持多渠道，多接收者）。
   * 会为每一次实际发送写入一条数据库记录。
   */
  async notify(params: SendNotificationParams) {
    const { level, title, message, meta } = params
    const channels = params.channels ?? this.defaultChannels(level)

    // 针对 Telegram，确定接收人（默认管理员）
    const telegramIds = params.telegramIds && params.telegramIds.length > 0
      ? params.telegramIds
      : (level === NotificationLevel.INFO ? [] : ENV.ADMIN_TG_IDS)

    const tasks: Array<Promise<void>> = []

    for (const channel of channels) {
      if (channel === NotificationChannel.TELEGRAM) {
        for (const chatId of telegramIds) {
          tasks.push(this.sendOne({ level, title, message, channel, target: chatId, meta }))
        }
      }
      else {
        tasks.push(this.sendOne({ level, title, message, channel, meta }))
      }
    }

    await Promise.allSettled(tasks)
  }

  private defaultChannels(level: NotificationLevel): NotificationChannel[] {
    switch (level) {
      case NotificationLevel.INFO:
        return [NotificationChannel.LOG]
      case NotificationLevel.WARN:
        return [NotificationChannel.LOG, NotificationChannel.TELEGRAM]
      case NotificationLevel.ERROR:
      case NotificationLevel.CRITICAL:
        return [NotificationChannel.TELEGRAM, NotificationChannel.LOG]
      default:
        return [NotificationChannel.LOG]
    }
  }

  private async sendOne(args: {
    level: NotificationLevel
    title?: string
    message: string
    channel: NotificationChannel
    target?: string
    meta?: Record<string, unknown>
  }) {
    const { level, title, message, channel, target, meta } = args

    // 1) 先写入记录（PENDING）
    const record = await prisma.notification.create({
      data: {
        level,
        channel,
        title,
        content: message,
        target,
        meta: meta ? JSON.stringify(meta) : undefined,
        status: 'PENDING',
      },
    })

    try {
      // 2) 实际发送
      await this.dispatchSend(channel, { title, message, target })

      // 3) 更新为 SENT
      await prisma.notification.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      })
    }
    catch (e) {
      const err = e as Error
      logger.error(`[NotificationService] send failed: ${err.message}`)
      await prisma.notification.update({
        where: { id: record.id },
        data: { status: 'FAILED', error: err.stack?.slice(0, 2000) ?? err.message },
      })
    }
  }

  private async dispatchSend(channel: NotificationChannel, payload: { title?: string, message: string, target?: string }) {
    const header = payload.title ? `【${payload.title}】` : ''
    const text = `${header}${payload.title ? '\n' : ''}${payload.message}`

    switch (channel) {
      case NotificationChannel.TELEGRAM: {
        if (!payload.target)
          throw new Error('TELEGRAM notification requires target(chatId)')
        await this.tg.api.sendMessage(payload.target, text)
        return
      }
      case NotificationChannel.LOG: {
        logger.info(`[NOTIFY] ${text}`)
        return
      }
      case NotificationChannel.CONSOLE: {
        // eslint-disable-next-line no-console
        console.log(`[NOTIFY] ${text}`)
        return
      }
      default:
        throw new Error(`Unsupported channel: ${channel}`)
    }
  }
}
