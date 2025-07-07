import { Err, Ok } from "./types.public"

/**
 * Base result type with common functionality.
 * 
 * This type provides the core methods shared between Ok and Err types.
 * It includes type guards and value access methods that are essential
 * for the Result pattern implementation.
 * 
 * @template T - The type of the success value
 * @template E - The type of the error value
 */
export type BaseResult<T, E> = {
  /**
   * Type guard that checks if this result is an Ok value.
   * @returns true if the result is Ok<T>, false otherwise
   * 
   * @example
   * const result = ok("success")
   * if (result.isOk()) {
   *   // TypeScript knows result.value exists here
   *   console.log(result.value) // "success"
   * }
   * 
   * @example
   * const result = err(new Error("failed"))
   * if (!result.isOk()) {
   *   // TypeScript knows this is an Err
   *   console.log(result.error.message) // "failed"
   * }
   */
  isOk: () => this is Ok<T>

  /**
   * Type guard that checks if this result is an Err value.
   * @returns true if the result is Err<E>, false otherwise
   * 
   * @example
   * const result = err(new Error("failed"))
   * if (result.isErr()) {
   *   // TypeScript knows result.error exists here
   *   console.log(result.error.message) // "failed"
   * }
   * 
   * @example
   * const result = ok("success")
   * if (!result.isErr()) {
   *   // TypeScript knows this is an Ok
   *   console.log(result.value) // "success"
   * }
   */
  isErr: () => this is Err<E>

  /**
   * Unwraps the result to get the raw value.
   * @returns The contained value (T) if Ok, or the error (E) if Err
   * 
   * @example
   * const okResult = ok("success")
   * console.log(okResult.unwrap()) // "success"
   * 
   * @example
   * const errResult = err(new Error("failed"))
   * console.log(errResult.unwrap()) // Error: failed
   */
  unwrap: () => T | E
}

/**
 * Extended base type for Ok results with success-specific methods.
 * 
 * This type adds methods specific to handling success values, including
 * pattern matching and tuple conversion. It handles both synchronous and
 * asynchronous (Promise) values.
 * 
 * @template T - The type of the success value
 */
export type OkBaseResult<T> = BaseResult<T, never> & {
  /**
   * Pattern matches on the result, transforming the success value.
   * For Ok results, only the ok function is called.
   * 
   * @template ROk - The type to transform the success value to
   * @template RErr - The type that would be returned for errors (never used for Ok)
   * @param ok - Function to transform the success value
   * @param _err - Optional function for error case (never called for Ok)
   * @returns Transformed success value, wrapped in Promise if T is a Promise
   * 
   * @example
   * // Synchronous value
   * const result = ok(5)
   * const doubled = result.match(
   *   value => value * 2,
   *   () => 0 // never called for Ok
   * ) // doubled = 10
   * 
   * @example
   * // Async value
   * const result = ok(Promise.resolve(5))
   * const doubled = await result.match(
   *   async value => value * 2,
   *   () => 0
   * ) // doubled = 10
   */
  match: <ROk, RErr>(ok: (value: Awaited<T>) => ROk, _err?: (error: never) => RErr) => T extends Promise<any> ? Promise<ROk> : ROk

  /**
   * Converts the result to a tuple of [value, undefined].
   * This is useful for destructuring and handling both success and error cases uniformly.
   * 
   * @returns A tuple where the first element is the success value and the second is undefined,
   * wrapped in Promise if T is a Promise
   * 
   * @example
   * // Synchronous value
   * const result = ok("success")
   * const [value, error] = result.pair()
   * console.log(value) // "success"
   * console.log(error) // undefined
   * 
   * @example
   * // Async value
   * const result = ok(Promise.resolve("success"))
   * const [value, error] = await result.pair()
   * console.log(value) // "success"
   * console.log(error) // undefined
   */
  pair: () => T extends Promise<any> ? Promise<[Awaited<T>, undefined]> : [T, undefined]
}

/**
 * Extended base type for Err results with error-specific methods.
 * 
 * This type adds methods specific to handling error values, including
 * pattern matching and tuple conversion. It handles both synchronous and
 * asynchronous (Promise) errors.
 * 
 * @template E - The type of the error value
 */
export type ErrBaseResult<E> = BaseResult<never, E> & {
  /**
   * Pattern matches on the result, transforming the error value.
   * For Err results, only the err function is called.
   * 
   * @template ROk - The type that would be returned for success (never used for Err)
   * @template RErr - The type to transform the error value to
   * @param _ok - Function for success case (never called for Err)
   * @param err - Function to transform the error value
   * @returns Transformed error value, wrapped in Promise if E is a Promise
   * 
   * @example
   * // Synchronous error
   * const result = err(new Error("failed"))
   * const message = result.match(
   *   () => "", // never called for Err
   *   error => `Error: ${error.message}`
   * ) // message = "Error: failed"
   * 
   * @example
   * // Async error
   * const result = err(Promise.resolve(new Error("failed")))
   * const message = await result.match(
   *   () => "",
   *   async error => `Error: ${error.message}`
   * ) // message = "Error: failed"
   */
  match: <ROk, RErr>(_ok: (value: never) => ROk, err: (error: Awaited<E>) => RErr) => E extends Promise<any> ? Promise<RErr> : RErr

  /**
   * Converts the result to a tuple of [undefined, error].
   * This is useful for destructuring and handling both success and error cases uniformly.
   * 
   * @returns A tuple where the first element is undefined and the second is the error value,
   * wrapped in Promise if E is a Promise
   * 
   * @example
   * // Synchronous error
   * const result = err(new Error("failed"))
   * const [value, error] = result.pair()
   * console.log(value) // undefined
   * console.log(error.message) // "failed"
   * 
   * @example
   * // Async error
   * const result = err(Promise.resolve(new Error("failed")))
   * const [value, error] = await result.pair()
   * console.log(value) // undefined
   * console.log(error.message) // "failed"
   */
  pair: () => E extends Promise<any> ? Promise<[undefined, Awaited<E>]> : [undefined, E]
}

/**
 * Helper type to create a tagged variant of a result type.
 * 
 * This type modifies the tag property of a result type while preserving
 * all other properties and methods. It's used internally to implement
 * custom tagging for both Ok and Err types.
 * 
 * @template T - The base result type to modify
 * @template Tag - The string literal type for the new tag
 * 
 * @example
 * // Tagged Ok result
 * type SuccessResult = WithTag<Ok<string>, "SUCCESS">
 * const result: SuccessResult = ok("data", "SUCCESS")
 * console.log(result.tag) // "SUCCESS"
 * 
 * @example
 * // Tagged Err result
 * type ValidationError = WithTag<Err<Error>, "VALIDATION">
 * const error: ValidationError = err(new Error("invalid"), "VALIDATION")
 * console.log(error.tag) // "VALIDATION"
 */
export type WithTag<T, Tag extends string> = Omit<T, 'tag'> & { tag: Tag }


export type ResultConfig<T, E extends Error, TagError extends string, TagOk extends string> = Partial<{
  isError: (value: T | E) => value is E;
  tagError: TagError;
  tagOk: TagOk;
}>