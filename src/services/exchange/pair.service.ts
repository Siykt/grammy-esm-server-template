import { Service } from '../../common/decorators/service.js'
import { prisma } from '../../common/prisma.js'
import { isLinear, parseSymbol } from './utils.js'

export interface CreatePairInput {
  symbol: string
  notes?: string
  addedByTg?: string
}

export interface UpdatePairInput {
  id: string
  symbol?: string
  enabled?: boolean
  notes?: string | null
}

@Service()
export class PairService {
  async create(input: CreatePairInput) {
    const { symbol, notes, addedByTg } = input
    const parsed = parseSymbol(symbol)
    return prisma.tradingPair.create({
      data: {
        symbol: symbol.toUpperCase(),
        base: parsed.base,
        quote: parsed.quote,
        isLinear: isLinear(parsed),
        notes: notes ?? null,
        addedByTg: addedByTg ?? null,
      },
    })
  }

  async list(params?: { enabled?: boolean }) {
    return prisma.tradingPair.findMany({
      where: {
        enabled: params?.enabled,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async update(input: UpdatePairInput) {
    const data: Record<string, unknown> = {}
    if (typeof input.enabled === 'boolean')
      data.enabled = input.enabled
    if (typeof input.notes !== 'undefined')
      data.notes = input.notes
    if (input.symbol) {
      const parsed = parseSymbol(input.symbol)
      data.symbol = input.symbol.toUpperCase()
      data.base = parsed.base
      data.quote = parsed.quote
      data.isLinear = isLinear(parsed)
    }
    return prisma.tradingPair.update({ where: { id: input.id }, data })
  }

  async remove(id: string) {
    return prisma.tradingPair.delete({ where: { id } })
  }
}
