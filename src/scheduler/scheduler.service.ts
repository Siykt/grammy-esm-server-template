import type {
  ISchedulerService,
  JobConfig,
  JobResult,
  ScheduledJob,
} from './scheduler.interface.js'
import { EventEmitter } from 'node:events'
import logger from '../common/logger.js'
import { JobStatus } from './scheduler.interface.js'

/**
 * Internal job representation
 */
interface InternalJob {
  config: JobConfig
  status: JobStatus
  intervalId?: NodeJS.Timeout
  lastRun?: Date
  lastResult?: JobResult
  nextRun?: Date
  runCount: number
  errorCount: number
  retryCount: number
}

/**
 * Scheduler Service
 * Manages scheduled jobs with configurable intervals
 */
export class SchedulerService extends EventEmitter implements ISchedulerService {
  private jobs: Map<string, InternalJob> = new Map()
  private running = false

  constructor() {
    super()
  }

  // ==================== Job Management ====================

  /**
   * Add a new job to the scheduler
   */
  addJob(config: JobConfig): void {
    if (this.jobs.has(config.name)) {
      logger.warn(`[Scheduler] Job ${config.name} already exists, replacing`)
      this.removeJob(config.name)
    }

    const job: InternalJob = {
      config: {
        ...config,
        enabled: config.enabled ?? true,
        maxRetries: config.maxRetries ?? 3,
        retryDelayMs: config.retryDelayMs ?? 5000,
      },
      status: JobStatus.IDLE,
      runCount: 0,
      errorCount: 0,
      retryCount: 0,
    }

    this.jobs.set(config.name, job)
    logger.info(`[Scheduler] Added job: ${config.name} (interval: ${config.intervalMs}ms)`)

    // Start the job if scheduler is running and job is enabled
    if (this.running && job.config.enabled) {
      this.startJobInternal(job)
    }
  }

  /**
   * Remove a job from the scheduler
   */
  removeJob(name: string): void {
    const job = this.jobs.get(name)
    if (job) {
      this.stopJobInternal(job)
      this.jobs.delete(name)
      logger.info(`[Scheduler] Removed job: ${name}`)
    }
  }

  /**
   * Get job information
   */
  getJob(name: string): ScheduledJob | undefined {
    const job = this.jobs.get(name)
    if (!job)
      return undefined

    return this.toScheduledJob(job)
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map(job => this.toScheduledJob(job))
  }

  // ==================== Job Control ====================

  /**
   * Start a specific job
   */
  startJob(name: string): void {
    const job = this.jobs.get(name)
    if (!job) {
      logger.warn(`[Scheduler] Job ${name} not found`)
      return
    }

    if (job.status === JobStatus.RUNNING) {
      logger.warn(`[Scheduler] Job ${name} is already running`)
      return
    }

    job.config.enabled = true
    this.startJobInternal(job)
  }

  /**
   * Stop a specific job
   */
  stopJob(name: string): void {
    const job = this.jobs.get(name)
    if (!job) {
      logger.warn(`[Scheduler] Job ${name} not found`)
      return
    }

    job.config.enabled = false
    this.stopJobInternal(job)
  }

  /**
   * Run a job immediately
   */
  async runJobNow(name: string): Promise<JobResult> {
    const job = this.jobs.get(name)
    if (!job) {
      return {
        success: false,
        duration: 0,
        error: `Job ${name} not found`,
      }
    }

    return this.executeJob(job)
  }

  // ==================== Scheduler Control ====================

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      logger.warn('[Scheduler] Scheduler is already running')
      return
    }

    this.running = true
    logger.info('[Scheduler] Starting scheduler')

    for (const job of this.jobs.values()) {
      if (job.config.enabled) {
        this.startJobInternal(job)
      }
    }

    logger.info(`[Scheduler] Started with ${this.jobs.size} jobs`)
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.running) {
      logger.warn('[Scheduler] Scheduler is not running')
      return
    }

    this.running = false
    logger.info('[Scheduler] Stopping scheduler')

    for (const job of this.jobs.values()) {
      this.stopJobInternal(job)
    }

    logger.info('[Scheduler] Stopped')
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.running
  }

  // ==================== Events ====================

  /**
   * Subscribe to job completion events
   */
  onJobComplete(callback: (job: ScheduledJob, result: JobResult) => void): () => void {
    this.on('jobComplete', callback)
    return () => this.off('jobComplete', callback)
  }

  /**
   * Subscribe to job error events
   */
  onJobError(callback: (job: ScheduledJob, error: Error) => void): () => void {
    this.on('jobError', callback)
    return () => this.off('jobError', callback)
  }

  // ==================== Internal Methods ====================

  private startJobInternal(job: InternalJob): void {
    if (job.intervalId) {
      clearInterval(job.intervalId)
    }

    job.status = JobStatus.RUNNING
    job.nextRun = new Date(Date.now() + job.config.intervalMs)

    // Run immediately if configured
    if (job.config.runImmediately) {
      this.executeJob(job).catch((error) => {
        logger.error(`[Scheduler] Initial run of ${job.config.name} failed`, error)
      })
    }

    // Schedule recurring execution
    job.intervalId = setInterval(async () => {
      await this.executeJob(job)
    }, job.config.intervalMs)

    logger.debug(`[Scheduler] Started job: ${job.config.name}`)
  }

  private stopJobInternal(job: InternalJob): void {
    if (job.intervalId) {
      clearInterval(job.intervalId)
      job.intervalId = undefined
    }

    job.status = JobStatus.STOPPED
    job.nextRun = undefined

    logger.debug(`[Scheduler] Stopped job: ${job.config.name}`)
  }

  private async executeJob(job: InternalJob): Promise<JobResult> {
    const startTime = Date.now()

    try {
      logger.debug(`[Scheduler] Executing job: ${job.config.name}`)

      await job.config.handler()

      const duration = Date.now() - startTime
      const result: JobResult = {
        success: true,
        duration,
      }

      job.lastRun = new Date()
      job.lastResult = result
      job.runCount++
      job.retryCount = 0
      job.nextRun = new Date(Date.now() + job.config.intervalMs)

      this.emit('jobComplete', this.toScheduledJob(job), result)
      logger.debug(`[Scheduler] Job ${job.config.name} completed in ${duration}ms`)

      return result
    }
    catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      job.lastRun = new Date()
      job.errorCount++
      job.retryCount++

      const result: JobResult = {
        success: false,
        duration,
        error: errorMessage,
      }

      job.lastResult = result

      // Retry logic
      if (job.retryCount < (job.config.maxRetries || 3)) {
        const retryDelay = job.config.retryDelayMs || 5000
        logger.warn(
          `[Scheduler] Job ${job.config.name} failed (attempt ${job.retryCount}/${job.config.maxRetries}), `
          + `retrying in ${retryDelay}ms: ${errorMessage}`,
        )

        setTimeout(() => {
          this.executeJob(job).catch(() => {
            // Error already handled in the recursive call
          })
        }, retryDelay)
      }
      else {
        job.retryCount = 0
        job.status = JobStatus.ERROR
        logger.error(`[Scheduler] Job ${job.config.name} failed after ${job.config.maxRetries} retries: ${errorMessage}`)
        this.emit('jobError', this.toScheduledJob(job), error instanceof Error ? error : new Error(errorMessage))
      }

      return result
    }
  }

  private toScheduledJob(job: InternalJob): ScheduledJob {
    return {
      name: job.config.name,
      intervalMs: job.config.intervalMs,
      status: job.status,
      lastRun: job.lastRun,
      lastResult: job.lastResult,
      nextRun: job.nextRun,
      runCount: job.runCount,
      errorCount: job.errorCount,
    }
  }
}
