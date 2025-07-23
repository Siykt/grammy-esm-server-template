/* eslint-disable ts/no-explicit-any */

// 扩展 global 对象
export declare global {
  /** 可写 */
  export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
  }

  /** 可空 */
  declare type Nullable<T> = T | null

  /** 不可空 */
  declare type NonNullable<T> = T extends null | undefined ? never : T

  /** 深度非空 */
  declare type DeepNonNullable<T> = {
    [P in keyof T]-?: DeepNonNullable<
      NonNullable<T[P]> extends object ? DeepNonNullable<NonNullable<T[P]>> : NonNullable<T[P]>
    >;
  }

  /** string 为 key 的字典 */
  declare type Recordable<T = any> = Record<string, T>

  /** string 为 key 的不可写字典 */
  declare interface ReadonlyRecordable<T = any> {
    readonly [key: string]: T
  }

  /** Partial深度处理版 */
  declare type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
  }

  /** Timeout 的 ReturnType. 无需处理Node.Timer */
  declare type TimeoutHandle = ReturnType<typeof setTimeout>

  /** Interval 的 ReturnType. 无需处理Node.Timer */
  declare type IntervalHandle = ReturnType<typeof setInterval>

  /** 预期的 Any */
  declare type ExpectedAnyData = any
}
