import { DEFAULT_TAG_ERROR } from '@/lib/constants'
import { ErrBaseResult } from '@/types.private'
import type { Err, Ok, Tagged } from '@/types.public'

/**
 * Creates an error Result type that wraps an error value.
 * 
 * The Err type represents a failed computation and provides methods to safely
 * handle the error value. It implements the Result pattern along with Ok type.
 * 
 * @template E - The type of the error value
 * @template Tag - Optional string literal type for custom tagging
 * 
 * @param error - The error value to wrap
 * @param tag - Optional custom tag for the result (defaults to "Err")
 * 
 * @returns An Err result containing the error and associated methods:
 * - isOk(): Returns false (type guard for Ok<never>)
 * - isErr(): Returns true (type guard for Err<E>)
 * - match(): Transforms the error using provided functions
 * - pair(): Returns a tuple of [undefined, error]
 * - unwrap(): Returns the raw error
 * 
 * @example
 * // Basic usage
 * const result = err(new Error("failed"))
 * if (result.isErr()) {
 *   console.log(result.error.message) // "failed"
 * }
 * 
 * // With custom tag
 * const tagged = err(new Error("failed"), "ValidationError")
 * console.log(tagged.tag) // "ValidationError"
 * 
 * // Pattern matching
 * result.match(
 *   () => {}, // never called for Err
 *   error => console.error(error)
 * )
 */
export function err<const E>(error: E): Err<E>
export function err<const E, const Tag extends string>(error: E, tag: Tag): Tagged<Err<E>, Tag>
export function err<const E, const Tag extends string>(error: E, tag?: Tag): Err<E> | Tagged<Err<E>, Tag> {
  const methods: ErrBaseResult<E> = {
    isOk: (): this is Ok<never> => false,
    isErr: (): this is Err<E> => true,
    match: <ROk, RErr>(_ok: (value: never) => ROk, err: (error: Awaited<E>) => RErr) => {
      if (error instanceof Promise) {
        return error.then(e => err(e as Awaited<E>)) as E extends Promise<any> ? Promise<RErr> : RErr
      }
      return err(error as Awaited<E>) as E extends Promise<any> ? never : RErr
    },
    pair: () => {
      if (error instanceof Promise) {
        return error.then(e => [undefined, e]) as E extends Promise<any> ? Promise<[undefined, Awaited<E>]> : [undefined, Awaited<E>]
      }
      return [undefined, error] as E extends Promise<any> ? never : [undefined, E]
    },
    unwrap: () => error,
  }

  const props: Omit<Err<E> | Tagged<Err<E>, Tag>, keyof typeof methods> = {
    tag: (tag ?? DEFAULT_TAG_ERROR) as Tag extends string ? Tag : 'Err',
    error
  }

  // @ts-expect-error - BaseResult<never, E> is not assignable to ErrBaseResult<E> - this is used for common methods
  // for Ok | Err types so they dont require "is" checks. However any type errors should be caught by methods and props declarations
  return {
    ...props,
    ...methods,
  }
}

