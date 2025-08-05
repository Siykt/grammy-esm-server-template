import type { Prisma } from '@prisma/client'
import { UserCreateInputSchema } from '../../../prisma/generated/zod/index.js'
import { Service } from '../../common/decorators/service.js'
import { prisma } from '../../common/prisma.js'

@Service()
export class UserService {
  constructor() {}

  createIfNotExists(data: Prisma.UserCreateInput) {
    return prisma.user.upsert({
      where: {
        telegramId: data.telegramId,
      },
      update: {
        ...data,
      },
      create: UserCreateInputSchema.parse(data),
    })
  }
}
