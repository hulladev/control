import { DEFAULT_TAG_OK } from '@/lib/constants'
import { OkBaseResult } from '@/types.private'
import type { Err, Ok, Tagged } from '@/types.public'

/**
 * Creates a successful Result type that wraps a value.
 * 
 * The Ok type represents a successful computation and provides methods to safely
 * handle the contained value. It implements the Result pattern along with Err type.
 * 
 * @template T - The type of the success value
 * @template Tag - Optional string literal type for custom tagging
 * 
 * @param value - The success value to wrap
 * @param tag - Optional custom tag for the result (defaults to "Ok")
 * 
 * @returns An Ok result containing the value and associated methods:
 * - isOk(): Returns true (type guard for Ok<T>)
 * - isErr(): Returns false (type guard for Err<never>)
 * - match(): Transforms the value using provided functions
 * - pair(): Returns a tuple of [value, undefined]
 * - unwrap(): Returns the raw value
 * 
 * @example
 * // Basic usage
 * const result = ok("success")
 * if (result.isOk()) {
 *   console.log(result.value) // "success"
 * }
 * 
 * // With custom tag
 * const tagged = ok("success", "ValidData")
 * console.log(tagged.tag) // "ValidData"
 * 
 * // Pattern matching
 * result.match(
 *   value => console.log(value),
 *   () => {} // never called for Ok
 * )
 * 
 * // Pair method
 * const [value, error] = result.pair()
 * if (error) {
 *   console.log(error) // never called for Ok
 * }
 * 
 * // Unwrap method
 * const unwrapped = result.unwrap()
 * console.log(unwrapped) // "success"
 */
export function ok<T>(value: T): Ok<T>
export function ok<T, const Tag extends string>(value: T, tag: Tag): Tagged<Ok<T>, Tag>
export function ok<T, const Tag extends string>(value: T, tag?: Tag): Ok<T> | Tagged<Ok<T>, Tag> {
  const methods: OkBaseResult<T> = {
    isOk: (): this is Ok<T> => true,
    isErr: (): this is Err<never> => false,
    match: <ROk>(ok: (value: Awaited<T>) => ROk) => {
      if (value instanceof Promise) {
        return value.then(v => ok(v as Awaited<T>)) as T extends Promise<any> ? Promise<ROk> : ROk
      }
      return ok(value as Awaited<T>) as T extends Promise<any> ? never : ROk
    },
    pair: () => {
      if (value instanceof Promise) {
        return value.then(v => [v as Awaited<T>, undefined]) as T extends Promise<any> ? Promise<[Awaited<T>, undefined]> : [T, undefined]
      }
      return [value as Awaited<T>, undefined] as T extends Promise<any> ? never : [T, undefined]
    },
    unwrap: () => value,
  }

  const props: Omit<Ok<T> | Tagged<Ok<T>, Tag>, keyof typeof methods> = {
    tag: (tag ?? DEFAULT_TAG_OK) as Tag extends string ? Tag : 'Ok',
    value
  }

  // @ts-expect-error - BaseResult<T, never> is not assignable to OkBaseResult<T> - this is used for common methods
  // for Ok | Err types so they dont require "is" checks. However any type errors should be caught by methods and props declarations
  return {
    ...props,
    ...methods,
  }
}
