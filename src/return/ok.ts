import { DEFAULT_TAG_OK } from '@/lib/constants';
import { isPromiseLike } from '@/lib/isPromiseLike';
import type { OkBaseResult } from '@/types.private';
import type { Err, Ok } from '@/types.public';

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
 * @param tag - Optional custom tag for the result (defaults to "ok")
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
export function ok<const T>(value: T): Ok<T>;
export function ok<const T, const Tag extends string>(value: T, tag: Tag): Ok<T, Tag>;
export function ok<const T, const Tag extends string>(
  value: T,
  tag: Tag | undefined,
): Ok<T, Tag | 'ok'>;
export function ok<const T, const Tag extends string>(value: T, tag?: Tag): Ok<T, Tag | 'ok'> {
  const methods: OkBaseResult<T, Tag | 'ok'> = {
    isOk: (): this is Ok<T, Tag | 'ok'> => true,
    isErr: (): this is Err<never, Tag | 'ok'> => false,
    match: <R>(onOk: (value: Awaited<T>) => R) => {
      return (
        isPromiseLike(value)
          ? Promise.resolve(value).then((v) => onOk(v as Awaited<T>))
          : onOk(value as Awaited<T>)
      ) as T extends PromiseLike<unknown> ? Promise<Awaited<R>> : R;
    },
    pair: () => {
      return (
        isPromiseLike(value)
          ? Promise.resolve(value).then((v) => [v, undefined])
          : [value, undefined]
      ) as T extends PromiseLike<unknown> ? Promise<[Awaited<T>, undefined]> : [T, undefined];
    },
    unwrap: () => value,
  };
  const result: Ok<T, Tag | 'ok'> = { ...methods, value, tag: tag ?? DEFAULT_TAG_OK };
  return result;
}
