import type { ScheduledTask } from 'node-cron'
import { EventEmitter } from 'node:events'
import cron from 'node-cron'
import logger from '../common/logger.js'

/**
 * 任务状态
 */
export enum JobStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Cron 任务配置
 */
export interface CronJobConfig {
  name: string
  cronExpression: string
  handler: () => Promise<void> | void
  enabled?: boolean
  runImmediately?: boolean
  timezone?: string
}

/**
 * Cron 任务信息
 */
export interface CronJobInfo {
  name: string
  cronExpression: string
  status: JobStatus
  lastRun?: Date
  nextRun?: Date
  runCount: number
  errorCount: number
}

/**
 * 内部任务表示
 */
interface InternalCronJob {
  config: CronJobConfig
  task?: ScheduledTask
  status: JobStatus
  lastRun?: Date
  runCount: number
  errorCount: number
}

/**
 * Cron 调度器服务
 * 使用 node-cron 实现可靠的任务调度
 */
export class CronSchedulerService extends EventEmitter {
  private jobs: Map<string, InternalCronJob> = new Map()
  private running = false

  constructor() {
    super()
  }

  /**
   * 添加新的 cron 任务
   */
  addJob(config: CronJobConfig): void {
    if (this.jobs.has(config.name)) {
      logger.warn(`[CronScheduler] 任务 ${config.name} 已存在，将替换`)
      this.removeJob(config.name)
    }

    // 验证 cron 表达式
    if (!cron.validate(config.cronExpression)) {
      throw new Error(`无效的 cron 表达式: ${config.cronExpression}`)
    }

    const job: InternalCronJob = {
      config: {
        ...config,
        enabled: config.enabled ?? true,
      },
      status: JobStatus.IDLE,
      runCount: 0,
      errorCount: 0,
    }

    this.jobs.set(config.name, job)
    logger.info(`[CronScheduler] 添加任务: ${config.name} (${config.cronExpression})`)

    // 如果调度器正在运行且任务已启用，则启动任务
    if (this.running && job.config.enabled) {
      this.startJobInternal(job)
    }
  }

  /**
   * 使用毫秒间隔添加任务（转换为 cron）
   */
  addIntervalJob(name: string, intervalMs: number, handler: () => Promise<void> | void, options?: {
    enabled?: boolean
    runImmediately?: boolean
  }): void {
    const cronExpression = this.intervalToCron(intervalMs)
    this.addJob({
      name,
      cronExpression,
      handler,
      ...options,
    })
  }

  /**
   * 将毫秒间隔转换为 cron 表达式
   */
  private intervalToCron(intervalMs: number): string {
    const seconds = Math.floor(intervalMs / 1000)

    if (seconds < 60) {
      return `*/${seconds} * * * * *` // 每 N 秒
    }

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return `*/${minutes} * * * *` // 每 N 分钟
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return `0 */${hours} * * *` // 每 N 小时
    }

    const days = Math.floor(hours / 24)
    return `0 0 */${days} * *` // 每 N 天
  }

  /**
   * 移除任务
   */
  removeJob(name: string): void {
    const job = this.jobs.get(name)
    if (job) {
      this.stopJobInternal(job)
      this.jobs.delete(name)
      logger.info(`[CronScheduler] 移除任务: ${name}`)
    }
  }

  /**
   * 获取任务信息
   */
  getJob(name: string): CronJobInfo | undefined {
    const job = this.jobs.get(name)
    if (!job)
      return undefined

    return this.toJobInfo(job)
  }

  /**
   * 获取所有任务
   */
  getAllJobs(): CronJobInfo[] {
    return Array.from(this.jobs.values()).map(job => this.toJobInfo(job))
  }

  /**
   * 启动指定任务
   */
  startJob(name: string): void {
    const job = this.jobs.get(name)
    if (!job) {
      logger.warn(`[CronScheduler] 任务 ${name} 未找到`)
      return
    }

    if (job.status === JobStatus.RUNNING) {
      logger.warn(`[CronScheduler] 任务 ${name} 已在运行`)
      return
    }

    job.config.enabled = true
    this.startJobInternal(job)
  }

  /**
   * 停止指定任务
   */
  stopJob(name: string): void {
    const job = this.jobs.get(name)
    if (!job) {
      logger.warn(`[CronScheduler] 任务 ${name} 未找到`)
      return
    }

    job.config.enabled = false
    this.stopJobInternal(job)
  }

  /**
   * 立即运行任务
   */
  async runJobNow(name: string): Promise<{ success: boolean, duration: number, error?: string }> {
    const job = this.jobs.get(name)
    if (!job) {
      return {
        success: false,
        duration: 0,
        error: `任务 ${name} 未找到`,
      }
    }

    return this.executeJob(job)
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.running) {
      logger.warn('[CronScheduler] 调度器已在运行')
      return
    }

    this.running = true
    logger.info('[CronScheduler] 启动调度器')

    for (const job of this.jobs.values()) {
      if (job.config.enabled) {
        this.startJobInternal(job)
      }
    }

    logger.info(`[CronScheduler] 已启动，共 ${this.jobs.size} 个任务`)
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.running) {
      logger.warn('[CronScheduler] 调度器未在运行')
      return
    }

    this.running = false
    logger.info('[CronScheduler] 停止调度器')

    for (const job of this.jobs.values()) {
      this.stopJobInternal(job)
    }

    logger.info('[CronScheduler] 已停止')
  }

  /**
   * 检查调度器是否正在运行
   */
  isRunning(): boolean {
    return this.running
  }

  /**
   * 订阅任务完成事件
   */
  onJobComplete(callback: (job: CronJobInfo, result: { success: boolean, duration: number }) => void): () => void {
    this.on('jobComplete', callback)
    return () => this.off('jobComplete', callback)
  }

  /**
   * 订阅任务错误事件
   */
  onJobError(callback: (job: CronJobInfo, error: Error) => void): () => void {
    this.on('jobError', callback)
    return () => this.off('jobError', callback)
  }

  // ==================== 内部方法 ====================

  private startJobInternal(job: InternalCronJob): void {
    if (job.task) {
      job.task.stop()
    }

    job.status = JobStatus.RUNNING

    // 如果配置了立即运行
    if (job.config.runImmediately) {
      this.executeJob(job).catch((error) => {
        logger.error(`[CronScheduler] ${job.config.name} 初始运行失败`, error)
      })
    }

    // 使用 node-cron 调度
    job.task = cron.schedule(
      job.config.cronExpression,
      async () => {
        await this.executeJob(job)
      },
      {
        timezone: job.config.timezone,
        name: job.config.name,
      },
    )

    logger.debug(`[CronScheduler] 已启动任务: ${job.config.name}`)
  }

  private stopJobInternal(job: InternalCronJob): void {
    if (job.task) {
      job.task.stop()
      job.task = undefined
    }

    job.status = JobStatus.STOPPED
    logger.debug(`[CronScheduler] 已停止任务: ${job.config.name}`)
  }

  private async executeJob(job: InternalCronJob): Promise<{ success: boolean, duration: number, error?: string }> {
    const startTime = Date.now()

    try {
      logger.debug(`[CronScheduler] 执行任务: ${job.config.name}`)

      await job.config.handler()

      const duration = Date.now() - startTime
      job.lastRun = new Date()
      job.runCount++

      const result = { success: true, duration }
      this.emit('jobComplete', this.toJobInfo(job), result)
      logger.debug(`[CronScheduler] 任务 ${job.config.name} 完成，耗时 ${duration}ms`)

      return result
    }
    catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      job.lastRun = new Date()
      job.errorCount++
      job.status = JobStatus.ERROR

      const result = { success: false, duration, error: errorMessage }
      logger.error(`[CronScheduler] 任务 ${job.config.name} 失败: ${errorMessage}`)
      this.emit('jobError', this.toJobInfo(job), error instanceof Error ? error : new Error(errorMessage))

      // 错误后恢复运行状态
      job.status = JobStatus.RUNNING

      return result
    }
  }

  private toJobInfo(job: InternalCronJob): CronJobInfo {
    return {
      name: job.config.name,
      cronExpression: job.config.cronExpression,
      status: job.status,
      lastRun: job.lastRun,
      runCount: job.runCount,
      errorCount: job.errorCount,
    }
  }
}

/** 预定义的 cron 表达式 */
export const CronExpressions = {
  /** 每秒 */
  EVERY_SECOND: '* * * * * *',
  /** 每 5 秒 */
  EVERY_5_SECONDS: '*/5 * * * * *',
  /** 每 10 秒 */
  EVERY_10_SECONDS: '*/10 * * * * *',
  /** 每 30 秒 */
  EVERY_30_SECONDS: '*/30 * * * * *',
  /** 每分钟 */
  EVERY_MINUTE: '* * * * *',
  /** 每 5 分钟 */
  EVERY_5_MINUTES: '*/5 * * * *',
  /** 每 10 分钟 */
  EVERY_10_MINUTES: '*/10 * * * *',
  /** 每 30 分钟 */
  EVERY_30_MINUTES: '*/30 * * * *',
  /** 每小时 */
  EVERY_HOUR: '0 * * * *',
  /** 每天午夜 */
  EVERY_DAY_MIDNIGHT: '0 0 * * *',
  /** 每天中午 */
  EVERY_DAY_NOON: '0 12 * * *',
  /** 每周日 */
  EVERY_WEEK_SUNDAY: '0 0 * * 0',
  /** 每月第一天 */
  EVERY_MONTH_FIRST: '0 0 1 * *',
}
