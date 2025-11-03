import { Container } from 'inversify'
import { getRegisteredServices } from '../common/decorators/service.js'
import { ExchangeService } from './exchange/exchange.service.js'
import { ExchangeMonitorService } from './exchange/monitor.service.js'
import { NotificationService } from './notification/notification.service.js'
import { TGBotService } from './tg/tg-bot.service.js'
import { TGPaymentService } from './tg/tg-payment.service.js'
import { UserService } from './user/user.service.js'

export const container = new Container()

getRegisteredServices().forEach((service) => {
  container.bind(service).toSelf().inSingletonScope()
})

export const tgBotService = container.get(TGBotService)
export const userService = container.get(UserService)
export const tgPaymentService = container.get(TGPaymentService)
export const exchangeService = container.get(ExchangeService)
export const exchangeMonitorService = container.get(ExchangeMonitorService)
export const notificationService = container.get(NotificationService)
