/**
 * Side Value Object
 * Represents the trading side (BUY or SELL)
 */
export enum TradeSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export class Side {
  private constructor(private readonly value: TradeSide) {}

  static BUY = new Side(TradeSide.BUY)
  static SELL = new Side(TradeSide.SELL)

  static fromString(value: string): Side {
    const normalized = value.toUpperCase()
    if (normalized === TradeSide.BUY) {
      return Side.BUY
    }
    if (normalized === TradeSide.SELL) {
      return Side.SELL
    }
    throw new Error(`Invalid side: ${value}`)
  }

  get isBuy(): boolean {
    return this.value === TradeSide.BUY
  }

  get isSell(): boolean {
    return this.value === TradeSide.SELL
  }

  opposite(): Side {
    return this.isBuy ? Side.SELL : Side.BUY
  }

  toString(): TradeSide {
    return this.value
  }

  equals(other: Side): boolean {
    return this.value === other.value
  }

  toJSON(): string {
    return this.value
  }
}
