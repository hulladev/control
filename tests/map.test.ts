import { runInNewContext } from 'node:vm';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { err, ok, tcf, type Err, type Ok, type Result } from '../src';

describe('map and mapErr', () => {
  it('transforms only the selected branch and preserves tags and source values', () => {
    const success = ok(21, 'YES');
    const failure = err('offline', 'NO');
    const mapped = success.map((v) => v * 2);
    const mappedError = failure.mapErr((message) => new Error(message));
    expectTypeOf(mapped).toEqualTypeOf<Ok<number, 'YES'>>();
    expectTypeOf(mappedError).toEqualTypeOf<Err<Error, 'NO'>>();
    expect(mapped.pair()).toEqual([42, undefined]);
    expect(mappedError.error.message).toBe('offline');
    expect(mapped.tag).toBe('YES');
    expect(mappedError.tag).toBe('NO');
    expect(success.value).toBe(21);
    expect(failure.error).toBe('offline');
    expect(ok(1, '').map((v) => v + 1).tag).toBe('');
    expect(err('bad', '').mapErr((v) => v.length).tag).toBe('');
  });

  it('returns the same instance and never invokes a mapper for the opposite branch', () => {
    const success = ok(1);
    const failure = err('failure');
    const transform = vi.fn(() => {
      throw new Error('must not run');
    });
    expect(success.mapErr(transform)).toBe(success);
    expect(failure.map(transform)).toBe(failure);
    expect(transform).not.toHaveBeenCalled();
  });

  it('chains transformations on a Result union with inferred callback and output types', () => {
    const transform = (input: Result<{ name: string }, Error, 'USER', 'FAILED'>) => {
      const mapped = input
        .map((user) => {
          expectTypeOf(user).toEqualTypeOf<{ name: string }>();
          return user.name.trim();
        })
        .mapErr((error) => {
          expectTypeOf(error).toEqualTypeOf<Error>();
          return error.message;
        });
      expectTypeOf(mapped).toEqualTypeOf<Result<string, string, 'USER', 'FAILED'>>();
      if (mapped.isOk()) expectTypeOf(mapped.tag).toEqualTypeOf<'USER'>();
      else expectTypeOf(mapped.tag).toEqualTypeOf<'FAILED'>();
      return mapped;
    };
    expect(transform(ok({ name: ' Sam ' }, 'USER')).unwrap()).toBe('Sam');
    expect(transform(err(new Error('offline'), 'FAILED')).unwrap()).toBe('offline');
  });

  it('composes with tcf and match', () => {
    const handled = tcf({
      try: () => ({ name: ' Sam ' }),
      catch: (error) => new Error(String(error)),
    })
      .map((user) => user.name.trim())
      .mapErr((error) => error.message);
    expectTypeOf(handled).toEqualTypeOf<Result<string, string>>();
    expect(
      handled.match(
        (name) => `Hi ${name}`,
        (message) => `Failed: ${message}`,
      ),
    ).toBe('Hi Sam');
  });

  it('keeps promise payloads wrapped and chainable, flattening async mapper output', async () => {
    const mapped = ok(Promise.resolve(20), 'ASYNC')
      .map((v) => Promise.resolve(v + 1))
      .map((v) => v * 2);
    expectTypeOf(mapped).toEqualTypeOf<Ok<Promise<number>, 'ASYNC'>>();
    expect(mapped.isOk()).toBe(true);
    expect(await mapped.pair()).toEqual([42, undefined]);
    const failure = err(Promise.resolve('offline'), 'ASYNC_ERROR')
      .mapErr((message) => Promise.resolve(new Error(message)))
      .mapErr((error) => error.message.toUpperCase());
    expectTypeOf(failure).toEqualTypeOf<Err<Promise<string>, 'ASYNC_ERROR'>>();
    expect(await failure.pair()).toEqual([undefined, 'OFFLINE']);
  });

  it('supports async mappers on synchronous payloads', async () => {
    const success = ok(1).map((v) => Promise.resolve(v + 1));
    const failure = err('no').mapErr((message) => Promise.resolve(message.length));
    expectTypeOf(success).toEqualTypeOf<Ok<Promise<number>>>();
    expectTypeOf(failure).toEqualTypeOf<Err<Promise<number>>>();
    expect(await success.unwrap()).toBe(2);
    expect(await failure.unwrap()).toBe(2);
  });

  it('assimilates thenables and cross-realm promises', async () => {
    const thenable: PromiseLike<number> = {
      then: (resolve, reject) => Promise.resolve(7).then(resolve, reject),
    };
    const foreign = runInNewContext('Promise.resolve(8)') as Promise<number>;
    expect(
      await ok(thenable)
        .map((v) => v + 1)
        .unwrap(),
    ).toBe(8);
    expect(
      await err(foreign)
        .mapErr((v) => v + 1)
        .unwrap(),
    ).toBe(9);
  });

  it('propagates synchronous mapper exceptions', () => {
    const failure = new Error('mapping failed');
    const transform = () => {
      throw failure;
    };
    expect(() => ok(1).map(transform)).toThrow(failure);
    expect(() => err('no').mapErr(transform)).toThrow(failure);
  });

  it('propagates rejected payloads without running the mapper', async () => {
    const failure = new Error('rejected');
    const transform = vi.fn(() => 1);
    await expect(ok(Promise.reject(failure)).map(transform).unwrap()).rejects.toBe(failure);
    await expect(err(Promise.reject(failure)).mapErr(transform).unwrap()).rejects.toBe(failure);
    expect(transform).not.toHaveBeenCalled();
  });

  it('propagates async mapper failures through the wrapped promise', async () => {
    const failure = new Error('mapping failed');
    const reject = () => Promise.reject(failure);
    const throwError = () => {
      throw failure;
    };
    await expect(ok(1).map(reject).unwrap()).rejects.toBe(failure);
    await expect(err('no').mapErr(reject).unwrap()).rejects.toBe(failure);
    await expect(ok(Promise.resolve(1)).map(throwError).unwrap()).rejects.toBe(failure);
    await expect(err(Promise.resolve('no')).mapErr(throwError).unwrap()).rejects.toBe(failure);
  });

  it('preserves inactive promise payload identity', async () => {
    const payload = Promise.resolve(42);
    const success = ok(payload);
    const failure = err(payload);
    expect(success.mapErr(() => 'unused')).toBe(success);
    expect(failure.map(() => 'unused')).toBe(failure);
    expect(success.unwrap()).toBe(payload);
    expect(failure.unwrap()).toBe(payload);
    await payload;
  });

  it('wraps falsy values and Result outputs without flattening branches', () => {
    expect(
      ok(1)
        .map(() => undefined)
        .pair(),
    ).toEqual([undefined, undefined]);
    expect(
      err('no')
        .mapErr(() => null)
        .pair(),
    ).toEqual([undefined, null]);
    const nested = ok(1).map(() => err('domain error'));
    expectTypeOf(nested).toEqualTypeOf<Ok<Err<'domain error'>>>();
    expect(nested.isOk()).toBe(true);
    expect(nested.value.isErr()).toBe(true);
  });
});
