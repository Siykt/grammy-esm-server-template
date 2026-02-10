/**
 * Quantity Value Object
 * Represents a quantity/size of shares or USDC
 */
export class Quantity {
  private readonly value: number

  private constructor(value: number) {
    if (value < 0) {
      throw new Error(`Invalid quantity: ${value}. Must be non-negative`)
    }
    this.value = value
  }

  static fromNumber(value: number): Quantity {
    return new Quantity(value)
  }

  static fromString(value: string): Quantity {
    return new Quantity(Number.parseFloat(value))
  }

  static zero(): Quantity {
    return new Quantity(0)
  }

  get amount(): number {
    return this.value
  }

  get isZero(): boolean {
    return this.value === 0
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value)
  }

  subtract(other: Quantity): Quantity {
    return new Quantity(Math.max(0, this.value - other.value))
  }

  multiply(factor: number): Quantity {
    return new Quantity(this.value * factor)
  }

  divide(divisor: number): Quantity {
    if (divisor === 0)
      throw new Error('Cannot divide by zero')
    return new Quantity(this.value / divisor)
  }

  /**
   * Calculate cost at given price
   */
  costAt(price: number): number {
    return this.value * price
  }

  /**
   * Calculate quantity affordable at given price with budget
   */
  static affordableAt(budget: number, price: number): Quantity {
    if (price <= 0)
      return new Quantity(0)
    return new Quantity(budget / price)
  }

  equals(other: Quantity): boolean {
    return Math.abs(this.value - other.value) < 0.0001
  }

  greaterThan(other: Quantity): boolean {
    return this.value > other.value
  }

  lessThan(other: Quantity): boolean {
    return this.value < other.value
  }

  toString(): string {
    return this.value.toFixed(6)
  }

  toJSON(): number {
    return this.value
  }

  /**
   * Round to minimum order size
   */
  roundToMinSize(minSize: number): Quantity {
    if (this.value < minSize)
      return new Quantity(0)
    return new Quantity(Math.floor(this.value / minSize) * minSize)
  }
}
