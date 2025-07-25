import type { Prisma } from '@prisma/client'
import { injectable } from 'inversify'
import { UserCreateInputSchema } from '../../../prisma/generated/zod/index.js'
import { prisma } from '../../common/prisma.js'

@injectable()
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
