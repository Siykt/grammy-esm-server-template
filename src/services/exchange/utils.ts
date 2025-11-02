export interface ParsedSymbol {
  base: string
  quote: 'USDT' | 'USD'
}

export function parseSymbol(input: string): ParsedSymbol {
  const s = input.replace(/\s+/g, '')
  if (s.includes('/')) {
    const [base, quote] = s.split('/')
    if ((quote as string) !== 'USDT' && quote !== 'USD')
      throw new Error(`Unsupported quote asset: ${quote}`)
    return { base: base.toUpperCase(), quote: quote as 'USDT' | 'USD' }
  }
  if (s.includes('-')) {
    const [base, quote] = s.split('-')
    if ((quote as string) !== 'USDT' && quote !== 'USD')
      throw new Error(`Unsupported quote asset: ${quote}`)
    return { base: base.toUpperCase(), quote: quote as 'USDT' | 'USD' }
  }
  if (s.toUpperCase().endsWith('USDT'))
    return { base: s.slice(0, -4).toUpperCase(), quote: 'USDT' }
  if (s.toUpperCase().endsWith('USD'))
    return { base: s.slice(0, -3).toUpperCase(), quote: 'USD' }
  throw new Error(`Unrecognized symbol format: ${input}`)
}

export function isLinear(parsed: ParsedSymbol): boolean {
  return parsed.quote === 'USDT'
}

// ---- 各所格式化 ----

export function toBinanceSymbol(input: string): { symbol: string; inverse: boolean; baseUrl: string } {
  const p = parseSymbol(input)
  if (isLinear(p)) {
    return { symbol: `${p.base}USDT`, inverse: false, baseUrl: 'https://fapi.binance.com' }
  }
  return { symbol: `${p.base}USD_PERP`, inverse: true, baseUrl: 'https://dapi.binance.com' }
}

export function toOkxInstId(input: string): { instId: string } {
  const p = parseSymbol(input)
  const quote = p.quote
  const instId = `${p.base}-${quote}-SWAP`
  return { instId }
}

export function toBybitSymbolAndCategory(input: string): { symbol: string; category: 'linear' | 'inverse' } {
  const p = parseSymbol(input)
  if (isLinear(p))
    return { symbol: `${p.base}USDT`, category: 'linear' }
  return { symbol: `${p.base}USD`, category: 'inverse' }
}


