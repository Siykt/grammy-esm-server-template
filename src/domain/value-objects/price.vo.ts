/**
 * Price Value Object
 * Represents a price with precision handling
 */
export class Price {
  private readonly value: number

  private constructor(value: number) {
    if (value < 0 || value > 1) {
      throw new Error(`Invalid price: ${value}. Must be between 0 and 1`)
    }
    this.value = value
  }

  static fromNumber(value: number): Price {
    return new Price(value)
  }

  static fromString(value: string): Price {
    return new Price(Number.parseFloat(value))
  }

  static zero(): Price {
    return new Price(0)
  }

  static one(): Price {
    return new Price(1)
  }

  get amount(): number {
    return this.value
  }

  /**
   * Convert to cents (0-100)
   */
  get cents(): number {
    return Math.round(this.value * 100)
  }

  /**
   * Calculate implied probability
   */
  get impliedProbability(): number {
    return this.value
  }

  /**
   * Calculate odds (e.g., 0.25 -> 4.0x)
   */
  get odds(): number {
    if (this.value === 0)
      return Infinity
    return 1 / this.value
  }

  add(other: Price): Price {
    return new Price(Math.min(1, this.value + other.value))
  }

  subtract(other: Price): Price {
    return new Price(Math.max(0, this.value - other.value))
  }

  multiply(factor: number): number {
    return this.value * factor
  }

  /**
   * Check if this price is underpriced compared to complement
   * (i.e., if priceYes + priceNo < 1, there's an arbitrage opportunity)
   */
  isUnderpriced(complementPrice: Price): boolean {
    return this.value + complementPrice.value < 1
  }

  /**
   * Check if this price is overpriced compared to complement
   */
  isOverpriced(complementPrice: Price): boolean {
    return this.value + complementPrice.value > 1
  }

  /**
   * Calculate arbitrage spread
   */
  arbitrageSpread(complementPrice: Price): number {
    return 1 - (this.value + complementPrice.value)
  }

  equals(other: Price): boolean {
    return Math.abs(this.value - other.value) < 0.0001
  }

  greaterThan(other: Price): boolean {
    return this.value > other.value
  }

  lessThan(other: Price): boolean {
    return this.value < other.value
  }

  toString(): string {
    return this.value.toFixed(4)
  }

  toJSON(): number {
    return this.value
  }

  /**
   * Round to tick size
   */
  roundToTick(tickSize: number): Price {
    const rounded = Math.round(this.value / tickSize) * tickSize
    return new Price(Math.max(0, Math.min(1, rounded)))
  }
}
