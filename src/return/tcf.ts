import { err } from './err'
import { ok } from './ok'
import type { Ok, Err, Tagged } from '@/types.public'

/**
 * A functional try-catch-finally wrapper that returns a Result type.
 * 
 * This function provides a type-safe way to handle errors by wrapping a try-catch-finally block
 * in a Result type. It supports both synchronous and asynchronous error handling, custom error
 * transformations, and optional tagging of success and error results.
 * 
 * @template T - The type of the success value
 * @template EC - The type of error that might be caught (must extend Error)
 * @template ER - The type of error after transformation (must extend Error or Promise<Error>)
 * @template TagError - Optional string literal type for error tagging
 * @template TagOk - Optional string literal type for success tagging
 * 
 * @example
 * // Basic usage
 * const result = tcf({
 *   try: () => JSON.parse('{"valid": "json"}'),
 *   catch: (error: SyntaxError) => new Error(`Parse failed: ${error.message}`),
 * })
 * 
 * // With custom tags and finally block
 * const result = tcf({
 *   try: () => fetchData(),
 *   catch: (error: NetworkError) => new ValidationError(error.message),
 *   finally: () => cleanup(),
 *   tagOk: "FETCH_SUCCESS",
 *   tagError: "FETCH_ERROR"
 * })
 * 
 * // Pattern matching the result
 * result.match(
 *   value => console.log("Success:", value),
 *   error => console.error("Failed:", error)
 * )
 */

// Overload 4: Both tags provided
export function tcf<T, EC extends Error, ER extends Error | Promise<Error>, TagError extends string, TagOk extends string>({
  // @ts-expect-error - Parameter renaming is required for reserved words
  try: tryFn,
  // @ts-expect-error - Parameter renaming is required for reserved words
  catch: catchFn,
  // @ts-expect-error - Parameter renaming is required for reserved words
  finally: finallyFn,
  tagError,
  tagOk,
}: {
  try: () => T
  catch: (error: EC) => ER
  finally?: () => unknown
  tagError: TagError
  tagOk: TagOk
}): Tagged<Ok<T>, TagOk> | Tagged<Err<ER>, TagError>

// Overload 1: No tags provided
export function tcf<T, EC extends Error, ER extends Error | Promise<Error>>({
  // @ts-expect-error - Parameter renaming is required for reserved words
  try: tryFn,
  // @ts-expect-error - Parameter renaming is required for reserved words
  catch: catchFn,
  // @ts-expect-error - Parameter renaming is required for reserved words
  finally: finallyFn,
}: {
  try: () => T
  catch: (error: EC) => ER
  finally?: () => unknown
}): Ok<T> | Err<ER>

// Overload 2: Only tagOk provided
export function tcf<T, EC extends Error, ER extends Error | Promise<Error>, TagOk extends string>({
  // @ts-expect-error - Parameter renaming is required for reserved words
  try: tryFn,
  // @ts-expect-error - Parameter renaming is required for reserved words
  catch: catchFn,
  // @ts-expect-error - Parameter renaming is required for reserved words
  finally: finallyFn,
  tagOk,
}: {
  try: () => T
  catch: (error: EC) => ER
  finally?: () => unknown
  tagOk: TagOk
}): Tagged<Ok<T>, TagOk> | Err<ER>

// Overload 3: Only tagError provided
export function tcf<T, EC extends Error, ER extends Error | Promise<Error>, TagError extends string>({
  // @ts-expect-error - Parameter renaming is required for reserved words
  try: tryFn,
  // @ts-expect-error - Parameter renaming is required for reserved words
  catch: catchFn,
  // @ts-expect-error - Parameter renaming is required for reserved words
  finally: finallyFn,
  tagError,
}: {
  try: () => T
  catch: (error: EC) => ER
  finally?: () => unknown
  tagError: TagError
}): Ok<T> | Tagged<Err<ER>, TagError>


// Implementation
export function tcf<T, EC extends Error, ER extends Error | Promise<Error>, TagError extends string = "error", TagOk extends string = "ok">({
  try: tryFn,
  catch: catchFn,
  finally: finallyFn,
  tagError,
  tagOk,
}: {
  try: () => T
  catch: (error: EC) => ER
  finally?: () => unknown
  tagError?: TagError
  tagOk?: TagOk
}): Ok<T> | Err<ER> | Tagged<Ok<T>, TagOk> | Tagged<Err<ER>, TagError> {
  try {
    if (tagOk === undefined) {
      return ok(tryFn()) as Ok<T>
    }
    return ok(tryFn(), tagOk) as Tagged<Ok<T>, TagOk>
  } catch (error) {
    if (tagError === undefined) {
      return err(catchFn(error as EC)) as Err<ER>
    }
    return err(catchFn(error as EC), tagError) as Tagged<Err<ER>, TagError>
  } finally {
    finallyFn?.()
  }
}

/**
 * Creates a Result from a value that might be an error.
 * 
 * This function provides a convenient way to create a Result type from a value
 * that might be either a success value or an error. It uses a type guard to
 * determine if the value is an error, and supports custom tagging.
 * 
 * @template T - The type of the success value
 * @template E - The type of the error value (must extend Error)
 * @template TagError - Optional string literal type for error tagging
 * @template TagOk - Optional string literal type for success tagging
 * 
 * @param value - The value to wrap in a Result
 * @param config - Optional configuration object
 * @param config.isError - Custom type guard for error detection
 * @param config.tagError - Custom tag for error results
 * @param config.tagOk - Custom tag for success results
 * 
 * @example
 * // Basic usage
 * const data = await fetchData()
 * const result = result(data)
 * 
 * // With custom error detection
 * const result = result(value, {
 *   isError: (v): v is CustomError => v instanceof CustomError,
 *   tagOk: "VALID_DATA",
 *   tagError: "INVALID_DATA"
 * })
 */