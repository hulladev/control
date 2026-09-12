import { isPromiseLike } from '@/lib/isPromiseLike';
import type { Err, Ok, Result } from '@/types.public';
import { err } from './err';
import { ok } from './ok';

type Outcome<T, E, TagOk extends string, TagError extends string> =
  | (T extends PromiseLike<unknown>
      ? Promise<Result<Awaited<T>, Awaited<E>, TagOk, TagError>>
      : Ok<T, TagOk>)
  | (E extends PromiseLike<unknown> ? Promise<Err<Awaited<E>, TagError>> : Err<E, TagError>);

type WithCleanup<R, F> = F extends PromiseLike<unknown> ? Promise<Awaited<R>> : R;

// Internal branch shape; public overloads preserve payload types and result methods.
type ResultShape = { tag: string; value: unknown } | { tag: string; error: unknown };

type Callbacks<T, EC, ER, F> = {
  try: () => T;
  catch: (error: EC) => ER;
  finally?: () => F;
};

/**
 * Typed try/catch/finally. Synchronous callbacks return a Result immediately;
 * promises from any callback are awaited. Use await tcf(...) for async work.
 * Catch receives unknown by default, since JavaScript can throw any value.
 * Exceptions from catch or finally propagate as in native try/catch/finally.
 */
export function tcf<const T, EC = unknown, ER extends Error | PromiseLike<Error> = Error, F = void>(
  options: Callbacks<T, EC, ER, F> & { tagError?: never; tagOk?: never },
): WithCleanup<Outcome<T, ER, 'ok', 'error'>, F>;
export function tcf<
  const T,
  EC = unknown,
  ER extends Error | PromiseLike<Error> = Error,
  const TagError extends string = 'error',
  const TagOk extends string = 'ok',
  F = void,
>(
  options: Callbacks<T, EC, ER, F> & { tagError: TagError; tagOk: TagOk },
): WithCleanup<Outcome<T, ER, TagOk, TagError>, F>;
export function tcf<
  const T,
  EC = unknown,
  ER extends Error | PromiseLike<Error> = Error,
  const TagError extends string = 'error',
  F = void,
>(
  options: Callbacks<T, EC, ER, F> & { tagError: TagError; tagOk?: never },
): WithCleanup<Outcome<T, ER, 'ok', TagError>, F>;
export function tcf<
  const T,
  EC = unknown,
  ER extends Error | PromiseLike<Error> = Error,
  const TagOk extends string = 'ok',
  F = void,
>(
  options: Callbacks<T, EC, ER, F> & { tagOk: TagOk; tagError?: never },
): WithCleanup<Outcome<T, ER, TagOk, 'error'>, F>;
export function tcf<
  const T,
  EC = unknown,
  ER extends Error | PromiseLike<Error> = Error,
  const TagError extends string = 'error',
  const TagOk extends string = 'ok',
  F = void,
>(
  options: Callbacks<T, EC, ER, F> & { tagError?: TagError; tagOk?: TagOk },
): WithCleanup<Outcome<T, ER, TagOk | 'ok', TagError | 'error'>, F>;
export function tcf(options: {
  try: () => unknown;
  catch: (error: never) => Error | PromiseLike<Error>;
  finally?: () => unknown;
  tagError?: string;
  tagOk?: string;
}): ResultShape | Promise<ResultShape> {
  const onError = (error: unknown) => {
    const mapped = options.catch(error as never);
    return isPromiseLike(mapped)
      ? Promise.resolve(mapped).then((value) => err(value, options.tagError))
      : err(mapped, options.tagError);
  };
  const run = () => {
    try {
      const value = options.try();
      return isPromiseLike(value)
        ? Promise.resolve(value).then((value) => ok(value, options.tagOk), onError)
        : ok(value, options.tagOk);
    } catch (error) {
      return onError(error);
    }
  };

  let outcome;
  try {
    outcome = run();
  } catch (error) {
    // A synchronous failure in catch still runs cleanup, exactly once.
    const cleanup = options.finally?.();
    if (isPromiseLike(cleanup)) {
      return Promise.resolve(cleanup).then(() => {
        throw error;
      });
    }
    throw error;
  }
  if (isPromiseLike(outcome)) {
    return Promise.resolve(outcome).finally(options.finally);
  }
  const cleanup = options.finally?.();
  return isPromiseLike(cleanup) ? Promise.resolve(cleanup).then(() => outcome) : outcome;
}
