/**
 * Job Status
 */
export enum JobStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Job Execution Result
 */
export interface JobResult {
  success: boolean
  duration: number
  error?: string
  // eslint-disable-next-line ts/no-explicit-any
  data?: any
}

/**
 * Job Configuration
 */
export interface JobConfig {
  name: string
  intervalMs: number
  handler: JobHandler
  enabled?: boolean
  runImmediately?: boolean
  maxRetries?: number
  retryDelayMs?: number
}

/**
 * Scheduled Job Interface
 */
export interface ScheduledJob {
  name: string
  intervalMs: number
  status: JobStatus
  lastRun?: Date
  lastResult?: JobResult
  nextRun?: Date
  runCount: number
  errorCount: number
}

/**
 * Job Handler Type
 */
export type JobHandler = () => Promise<void> | void

/**
 * Scheduler Service Interface
 */
export interface ISchedulerService {
  // Job management
  addJob: (config: JobConfig) => void
  removeJob: (name: string) => void
  getJob: (name: string) => ScheduledJob | undefined
  getAllJobs: () => ScheduledJob[]

  // Job control
  startJob: (name: string) => void
  stopJob: (name: string) => void
  runJobNow: (name: string) => Promise<JobResult>

  // Scheduler control
  start: () => void
  stop: () => void
  isRunning: () => boolean

  // Events
  onJobComplete: (callback: (job: ScheduledJob, result: JobResult) => void) => () => void
  onJobError: (callback: (job: ScheduledJob, error: Error) => void) => () => void
}
