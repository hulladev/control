import { Result } from "@/types.public";
import { ok } from "./ok";
import { err } from "./err";
import { DEFAULT_TAG_ERROR, DEFAULT_TAG_OK } from "@/lib/constants";

/**
 * Type guard that checks if a value is an Error instance.
 * Used as the default error detection strategy in the result function.
 * 
 * @template E - The specific Error type to check for
 * @param value - The value to check
 * @returns true if the value is an instance of Error, false otherwise
 */
const defaultIsError = <E extends Error>(value: unknown): value is E => value instanceof Error

/**
 * Creates a Result type from a value that might be an error.
 * 
 * This function provides a convenient way to wrap values that might be errors
 * into a Result type. It uses a type guard to determine if the value is an error,
 * and supports custom tagging for both success and error cases.
 * 
 * @template T - The type of the success value
 * @template E - The type of the error value (must extend Error)
 * @template TagError - Optional string literal type for error tagging (defaults to "error")
 * @template TagOk - Optional string literal type for success tagging (defaults to "ok")
 * 
 * @param value - The value to wrap in a Result
 * @param config - Optional configuration object
 * @param config.isError - Custom type guard for error detection (defaults to instanceof Error check)
 * @param config.tagError - Custom tag for error results
 * @param config.tagOk - Custom tag for success results
 * 
 * @returns A Result type containing either the success value or the error
 * 
 * @example
 * // Basic usage with automatic error detection
 * const data = await fetchData()
 * const result = result(data)
 * 
 * // With custom error detection
 * const result = result(value, {
 *   isError: (v): v is ValidationError => v instanceof ValidationError,
 *   tagOk: "VALID",
 *   tagError: "INVALID"
 * })
 * 
 * // Pattern matching the result
 * result.match(
 *   value => console.log("Success:", value),
 *   error => console.error("Error:", error.message)
 * )
 */
export function result<T, E extends Error, TagError extends string = "error", TagOk extends string = "ok">(
  value: T | E,
  config?: { isError?: (value: T | E) => this is E, tagError?: TagError, tagOk?: TagOk }
): Result<T, E> {
  const isError = config?.isError ?? defaultIsError
  if (isError(value)) {
    return err(value as E, config?.tagError ?? DEFAULT_TAG_ERROR) as unknown as Result<T, E>
  }
  return ok(value, config?.tagOk ?? DEFAULT_TAG_OK) as unknown as Result<T, E>
}