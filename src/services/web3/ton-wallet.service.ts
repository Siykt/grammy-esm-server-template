import type { IStorage, SendTransactionRequest, WalletInfoRemote } from '@tonconnect/sdk'
import { bigint2amount, pTimeout, safeStringify, TonCenterClient, TonCenterClientApis } from '@atp-tools/lib'
import { beginCell, toNano } from '@ton/core'
import { TonConnect } from '@tonconnect/sdk'
import dayjs from 'dayjs'
import { Service } from '../../common/decorators/service.js'
import logger from '../../common/logger.js'
import { prisma } from '../../common/prisma.js'
import { ENV } from '../../constants/env.js'

class TonConnectStorage implements IStorage {
  constructor(private readonly paymentName: string, private readonly chatId: number) {}

  private getKey(key: string): string {
    return `${this.paymentName}:${this.chatId}:${key}`
  }

  async removeItem(key: string): Promise<void> {
    const item = await prisma.telegramMessageSession.findUnique({
      where: {
        key: this.getKey(key),
      },
    })
    if (item) {
      await prisma.telegramMessageSession.delete({
        where: {
          key: item.key,
        },
      })
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await prisma.telegramMessageSession.upsert({
      where: {
        key: this.getKey(key),
      },
      create: {
        key: this.getKey(key),
        value,
      },
      update: {
        value,
      },
    })
  }

  async getItem(key: string): Promise<string | null> {
    const session = await prisma.telegramMessageSession.findUnique({
      where: {
        key: this.getKey(key),
      },
    })
    return session?.value || null
  }
}

export class TonWallet {
  connecter: TonConnect
  wallet: WalletInfoRemote | null = null

  constructor(private readonly chatId: number) {
    this.connecter = new TonConnect({
      manifestUrl: ENV.TON_WALLETS_APP_MANIFEST_URL,
      storage: new TonConnectStorage('telegram-wallet', chatId),
    })
  }

  async init() {
    const wallets = await this.connecter.getWallets()
    this.wallet = wallets.find(wallet => wallet.appName.toLowerCase() === 'telegram-wallet') as WalletInfoRemote

    await this.connecter.restoreConnection()

    if (!this.wallet) {
      throw new Error('Telegram wallet not found')
    }
  }

  get isConnected() {
    return this.connecter.connected
  }

  get connectLink() {
    if (!this.wallet)
      throw new Error('Wallet not initialized')
    return this.connecter.connect({
      bridgeUrl: this.wallet.bridgeUrl,
      universalLink: this.wallet.universalLink,
    })
  }

  waitConnected(timeout = 120000) {
    return pTimeout(new Promise<void>((resolve, reject) => {
      this.connecter.onStatusChange(status => status && resolve(), reject)
    }), timeout)
  }

  buildComment(comment: string | number | bigint) {
    return beginCell()
      .store((builder) => {
        builder.storeUint(0, 32)
        builder.storeStringRefTail(comment.toString())
      })
      .endCell()
      .toBoc()
      .toString('base64')
  }

  sendTransferWithComment(
    request: Omit<SendTransactionRequest, 'messages'> & {
      messages: (Omit<SendTransactionRequest['messages'][0], 'payload'> & { comment: string | number | bigint })[]
    },
    options?: {
      onRequestSent?: () => void
      signal?: AbortSignal
    },
  ) {
    if (!this.isConnected)
      throw new Error('Connecter not connected')
    return this.connecter.sendTransaction(
      {
        ...request,
        messages: request.messages.map(message => ({
          ...message,
          payload: this.buildComment(message.comment),
        })),
      },
      options,
    )
  }

  async pay(address: string, amount: number) {
    await this.waitConnected()

    const validUntil = dayjs().add(10, 'm').unix() // 10 minutes
    return pTimeout(
      this.sendTransferWithComment(
        {
          validUntil,
          messages: [{ address, amount: toNano(amount).toString(), comment: this.chatId }],
        },
        {
          onRequestSent: () => {
            logger.info(`${this.chatId} Payment request sent: ${amount}`)
          },
        },
      ),
      600000, // 10 minutes
    )
  }
}

@Service()
export class TonWalletService {
  wallet: WalletInfoRemote | null = null
  private wallets = new Map<number, TonWallet>()

  constructor() {
    TonCenterClient.setAuth(ENV.TON_CENTER_API_KEY, 'Authorization')
  }

  /**
   * get TON wallet open link
   * @returns link
   */
  get tonWalletOpenLink() {
    return 'https://t.me/wallet/start?startapp=tonconnect'
  }

  /**
   * create a new wallet
   * @param chatId chat id
   * @returns wallet
   */
  async create(chatId: number) {
    let wallet = this.wallets.get(chatId)
    if (!wallet) {
      wallet = new TonWallet(chatId)
      await wallet.init()
      this.wallets.set(chatId, wallet)
    }
    return wallet
  }

  /**
   * get TON price
   * @param tonAmount TON amount
   * @returns price
   */
  async getTonPrice(tonAmount: number) {
    const tonPrice = await prisma.telegramMessageSession.findFirst({
      where: {
        key: 'ton-price',
      },
    })

    // 10 minute cache
    const { rate, timestamp } = JSON.parse(tonPrice?.value || '{}') as { rate: number, timestamp: number }
    if (!rate || !timestamp || Date.now() - timestamp > 600_000) {
      // update price
      const result = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd')
      const data = await result.json() as { 'the-open-network': { usd: number } }
      const rate = data['the-open-network'].usd || 1
      await prisma.telegramMessageSession.upsert({
        where: {
          key: 'ton-price',
        },
        create: {
          key: 'ton-price',
          value: safeStringify({
            rate,
            timestamp: Date.now(),
          }),
        },
        update: {
          value: safeStringify({
            rate,
            timestamp: Date.now(),
          }),
        },
      })
      return {
        amount: rate * tonAmount,
        rate,
      }
    }

    return {
      amount: rate * tonAmount,
      rate,
    }
  }

  /**
   * get TON transactions
   * @param account account address
   * @param startUTime start time
   * @param offset offset
   * @returns transactions
   */
  async getTransactions(account: string[], startUTime?: number, offset?: number) {
    const { transactions } = await TonCenterClientApis.apiV3GetTransactions({
      account,
      limit: 1000,
      start_utime: startUTime,
      offset,
    })

    if (!transactions || transactions.length === 0) {
      return []
    }

    return transactions.map(transaction => ({
      id: transaction.hash || '',
      account: transaction.account,
      comment: transaction.in_msg?.message_content?.decoded?.comment,
      amount: bigint2amount(transaction.in_msg?.value || '0', 9),
      createdAt: transaction.in_msg?.created_at,
    }))
  }
}
