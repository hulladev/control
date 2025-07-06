import { BaseResult, ErrBaseResult, OkBaseResult, WithTag } from "./types.private"

/**
 * Success type that preserves tag information.
 * 
 * Represents a successful computation result with a value of type T.
 * The Ok type is part of the Result pattern and provides type-safe
 * access to success values.
 * 
 * @template T - The type of the success value
 */
export type Ok<T> = BaseResult<T, never> & OkBaseResult<T> & {
  value: T
  tag: "Ok"
}

/**
 * Error type with default error tag.
 * 
 * Represents a failed computation result with an error of type E.
 * The Err type is part of the Result pattern and provides type-safe
 * access to error values.
 * 
 * @template E - The type of the error value
 */
export type Err<E> = BaseResult<never, E> & ErrBaseResult<E> & {
  error: E
  tag: "Err"
}

/**
 * Result type that can be either Ok or Err.
 * 
 * This is the main type used for error handling in a functional way.
 * It ensures type safety by requiring that the error type E is different
 * from the success type T. This prevents ambiguous cases where the same
 * type could represent both success and failure.
 * 
 * @template T - The type of the success value
 * @template E - The type of the error value (must be different from T)
 * 
 * @example
 * // Valid usage
 * let result: Result<string, Error> 
 * result = ok("success")
 * result = err(new Error("error"))
 * 
 * // Invalid usage - Error type cannot be same as success type
 * let invalid: Result<Error, Error> // type error
 * 
 * // With custom tags
 * result = ok("success", "ValidData")
 * result = err(new Error("error"), "ValidationError")
 */
export type Result<T, E> = [E] extends [T] ? never : Ok<T> | Err<E>

/**
 * Tagged result type that allows custom tags while preserving the base type.
 * 
 * This type allows adding custom string tags to Ok and Err types while
 * maintaining their original functionality. This is useful for adding
 * more context to results or categorizing different types of successes
 * and failures.
 * 
 * @template T - The base result type (Ok<U> or Err<E>)
 * @template Tag - The string literal type for the custom tag
 */
export type Tagged<T, Tag extends string> = T extends Ok<infer U> 
  ? WithTag<Ok<U>, Tag> 
  : T extends Err<infer E> 
    ? WithTag<Err<E>, Tag> 
    : never