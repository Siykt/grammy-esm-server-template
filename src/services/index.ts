import { Container } from 'inversify'
import { TGBotService } from './tg/tg-bot.service.js'
import { UserService } from './user/user.service.js'

export const container = new Container()
export const services = [TGBotService, UserService]

services.forEach((service) => {
  container.bind(service).toSelf().inSingletonScope()
})

export const tgBotService = container.get(TGBotService)
export const userService = container.get(UserService)
