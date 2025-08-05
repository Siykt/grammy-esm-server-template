import type { PreCheckoutQueryX } from '@grammyjs/hydrate/out/data/pre-checkout-query.js'
import type { AbortSignal } from 'abort-controller'
import type { RawApi } from 'grammy'
import type { TGBotApiOther, TGBotContext } from './tg-bot.service.js'
import { inject } from 'inversify'
import { customAlphabet, urlAlphabet } from 'nanoid'
import { Service } from '../../common/decorators/service.js'
import { TGBotService } from './tg-bot.service.js'

/**
 * Create star invoice link parameters
 */
export interface CreateStarInvoiceLinkParameters {
  /**
   * USD Price
   * @description $1.99 = 100⭐️
   */
  price?: number

  /**
   * Stars
   * @description 1⭐️ = 0.02$
   */
  stars?: number

  /**
   * Product name, 1-32 characters
   */
  title: string

  /**
   * Product description, 1-255 characters
   */
  description: string

  /**
   * Callback function
   */
  onCheckout?: (payload: string, ctx: TGBotContext) => Promise<void>
}

@Service()
export class TGPaymentService {
  readonly payloadGenerator = customAlphabet(urlAlphabet, 8)

  constructor(
    @inject(TGBotService)
    private readonly tgBotService: TGBotService,
  ) {}

  /**
   * convert usd to stars
   * @param usdPrice - usd price
   * @returns the stars
   */
  convertUSDToStars(usdPrice: number) {
    // fixed: 1$ = 50 stars
    return Math.ceil(usdPrice * 50)
  }

  /**
   * convert stars to usd
   * @param stars - stars
   * @returns the usd price
   */
  convertStarsToUSD(stars: number) {
    // fixed: 1$ = 50 stars
    return Math.ceil(stars / 50)
  }

  private replacePayload(description: string, payload: string) {
    return description.replace('{{payload}}', payload)
  }

  private getStarPrice(params: CreateStarInvoiceLinkParameters) {
    const { price, stars } = params
    const amount = price ? this.convertUSDToStars(price) : stars

    if (!amount)
      throw new Error('Price or Stars is required')

    if (amount < 1 || amount > 100000)
      throw new Error(`Amount must be between 1 and 100000`)

    if (amount % 1)
      throw new Error('Amount must be an integer')

    return amount
  }

  /**
   * create star invoice link
   * @param params - parameters
   * @param options - options
   * @param signal - signal
   * @returns the link, payload and amount
   */
  async createStarInvoiceLink(
    params: CreateStarInvoiceLinkParameters,
    options?: TGBotApiOther<RawApi, 'createInvoiceLink', 'title' | 'description' | 'payload' | 'provider_token' | 'currency' | 'prices'>,
    signal?: AbortSignal,
  ) {
    const amount = this.getStarPrice(params)
    const payload = this.payloadGenerator()
    const prices = [{ label: 'Buy', amount }]

    const link = await this.tgBotService.api.createInvoiceLink(
      params.title,
      this.replacePayload(params.description, payload),
      payload,
      '',
      'XTR',
      prices,
      options,
      signal,
    )

    const { onCheckout } = params
    if (onCheckout) {
      const onPaymentSuccessHandler = async (ctx: TGBotContext) => {
        const { invoice_payload } = ctx.preCheckoutQuery as PreCheckoutQueryX
        if (invoice_payload === payload) {
          await onCheckout(payload, ctx)
        }
      }
      this.tgBotService.on('pre_checkout_query', onPaymentSuccessHandler)
    }

    return { link, payload, amount }
  }

  /**
   * send stars invoice message
   * @param params - parameters
   * @param options - options
   * @param signal - signal
   * @returns the message, payload and amount
   */
  async sendStarsInvoiceMessage(
    params: CreateStarInvoiceLinkParameters & { chatId: string },
    options?: TGBotApiOther<RawApi, 'sendInvoice', 'title' | 'description' | 'payload' | 'provider_token' | 'currency' | 'prices'>,
    signal?: AbortSignal,
  ) {
    const { title, description } = params
    const amount = this.getStarPrice(params)
    const payload = this.payloadGenerator()
    const prices = [{ label: 'Buy', amount }]
    const message = await this.tgBotService.api.sendInvoice(
      params.chatId,
      title,
      this.replacePayload(description, payload),
      payload,
      'XTR',
      prices,
      options,
      signal,
    )

    const { onCheckout } = params
    if (onCheckout) {
      const onPaymentSuccessHandler = async (ctx: TGBotContext) => {
        const { invoice_payload } = ctx.preCheckoutQuery as PreCheckoutQueryX
        if (invoice_payload === payload) {
          await onCheckout(payload, ctx)
        }
      }
      this.tgBotService.on('pre_checkout_query', onPaymentSuccessHandler)
    }

    return { message, payload, amount }
  }

  /**
   * on stars checkout
   * @param handler - handler
   */
  async onStarsCheckout(handler: Required<CreateStarInvoiceLinkParameters>['onCheckout']) {
    this.tgBotService.on('pre_checkout_query', async (ctx) => {
      const { invoice_payload } = ctx.preCheckoutQuery

      // payment success
      // await ctx.answerPreCheckoutQuery(true)

      // payment failed
      // await ctx.answerPreCheckoutQuery(false, { error_message: 'Something went wrong' })
      await handler(invoice_payload, ctx)
    })
  }
}
