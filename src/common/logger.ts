import path from 'node:path'
import winston, { format } from 'winston'
import { ENV } from '../constants/env.js'
import { isDev } from './is.js'

const jsonLogFileFormat = format.combine(
  format.errors({ stack: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp, stack }) => {
    // print log trace
    if (stack)
      return `${timestamp} ${level}: ${message} - ${stack}`
    return `${timestamp} ${level}: ${message}`
  }),
)

const logger = winston.createLogger({
  level: isDev() ? 'debug' : 'info',
  format: jsonLogFileFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(ENV.LOGGER_DIR_PATH, 'error.log'),
      level: 'error',
      maxFiles: 5,
      maxsize: 5242880,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(ENV.LOGGER_DIR_PATH, 'combined.log'),
      maxFiles: 5,
      maxsize: 5242880,
      tailable: true,
    }),
    new winston.transports.Console({
      format: format.combine(
        format.errors({ stack: true }),
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          // print log trace
          if (stack)
            return `${timestamp} ${level}: ${message} - ${stack}`
          return `${timestamp} ${level}: ${message}`
        }),
      ),
    }),
  ],
})

export default logger
