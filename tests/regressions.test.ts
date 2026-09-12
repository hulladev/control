import { runInNewContext } from 'node:vm';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { err, ok, result, tcf, type Err, type Ok, type Result, type Tagged } from '../src';

describe('public type and runtime contracts', () => {
  it('keeps default tags and custom tag guards consistent', () => {
    expectTypeOf(ok(1).tag).toEqualTypeOf<'ok'>();
    expectTypeOf(err('failure').tag).toEqualTypeOf<'error'>();
    expect(ok(1).tag).toBe('ok');
    expect(err('failure').tag).toBe('error');
    const check = (value: Tagged<Ok<number>, 'YES'> | Tagged<Err<string>, 'NO'>) => {
      if (value.isOk()) {
        expectTypeOf(value.tag).toEqualTypeOf<'YES'>();
        expectTypeOf(value.value).toEqualTypeOf<number>();
      } else {
        expectTypeOf(value.tag).toEqualTypeOf<'NO'>();
        expectTypeOf(value.error).toEqualTypeOf<string>();
      }
      if (value.isErr()) expectTypeOf(value.tag).toEqualTypeOf<'NO'>();
    };
    check(ok(1, 'YES'));
    check(err('failure', 'NO'));
  });

  it('permits overlapping and never payload types', () => {
    const success: Result<string, never> = ok('yes');
    const failure: Result<string, string> = err('no');
    const unknown: Result<unknown, Error> = err(new Error('failure'));
    expect(success.isOk()).toBe(true);
    expect(failure.isErr()).toBe(true);
    expect(unknown.isErr()).toBe(true);
  });

  it('excludes errors from inferred success values and preserves empty tags', () => {
    const convert = (input: string | Error) => result(input);
    const value = convert('yes');
    if (value.isOk()) expectTypeOf(value.value).toEqualTypeOf<string>();
    expect(result('yes', { tagOk: '' }).tag).toBe('');
    expect(result(new Error('no'), { tagError: '' }).tag).toBe('');
  });

  it('retains both tags from configuration variables', () => {
    const config = { tagOk: 'YES', tagError: 'NO' } as const;
    const converted = result(1, config);
    expectTypeOf(converted.tag).toEqualTypeOf<'YES' | 'NO'>();
    const optional: { tagOk?: 'YES'; tagError?: 'NO' } = {};
    const defaulted = result(1, optional);
    expectTypeOf(defaulted.tag).toEqualTypeOf<'YES' | 'NO' | 'ok' | 'error'>();
    expect(defaulted.tag).toBe('ok');
  });

  it('awaits thenables and promises from other realms', async () => {
    const thenable: PromiseLike<number> = {
      then: (resolve, reject) => Promise.resolve(7).then(resolve, reject),
    };
    const foreign = runInNewContext('Promise.resolve(8)') as Promise<number>;
    expect(await ok(thenable).match((v) => v * 2)).toBe(14);
    expect(await ok(foreign).pair()).toEqual([8, undefined]);
    expect(
      await err(thenable).match(
        () => 0,
        (v) => v * 2,
      ),
    ).toBe(14);
    expect(await err(foreign).pair()).toEqual([undefined, 8]);
    const flattened = ok(Promise.resolve(1)).match((v) => Promise.resolve(v + 1));
    expectTypeOf(flattened).toEqualTypeOf<Promise<number>>();
    expect(await flattened).toBe(2);
  });
});

describe('tcf sync/async control flow', () => {
  const mapError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

  it('keeps synchronous calls synchronous and defaults catch input to unknown', () => {
    const handled = tcf({
      try: () => 42,
      catch: (error) => {
        expectTypeOf(error).toEqualTypeOf<unknown>();
        return mapError(error);
      },
    });
    expectTypeOf(handled).toEqualTypeOf<Ok<number> | Err<Error>>();
    expect(handled.isOk()).toBe(true);
  });

  it('includes default tags when configured tags are optional', () => {
    const options: { tagOk?: 'YES'; tagError?: 'NO' } = {};
    const handled = tcf({ try: () => 1, catch: mapError, ...options });
    expectTypeOf(handled.tag).toEqualTypeOf<'YES' | 'NO' | 'ok' | 'error'>();
    expect(handled.tag).toBe('ok');
    const contextual: Result<number, Error> = tcf({ try: () => 1, catch: mapError });
    expect(contextual.tag).toBe('ok');
  });

  it('catches rejections, awaits catch and runs finally after it', async () => {
    const events: string[] = [];
    const handled = await tcf({
      try: () => Promise.reject(new Error('failure')),
      catch: async (error) => {
        await Promise.resolve();
        events.push('catch');
        return mapError(error);
      },
      finally: async () => {
        await Promise.resolve();
        events.push('finally');
      },
      tagError: 'FAILURE',
      tagOk: 'SUCCESS',
    });
    expect(events).toEqual(['catch', 'finally']);
    expect(handled.isErr()).toBe(true);
    if (handled.isErr()) expectTypeOf(handled.tag).toEqualTypeOf<'FAILURE'>();
    expect(handled.tag).toBe('FAILURE');
  });

  it('waits for successful work before cleanup', async () => {
    const events: string[] = [];
    const handled = await tcf({
      try: async () => {
        await Promise.resolve();
        events.push('try');
        return 42;
      },
      catch: mapError,
      finally: () => {
        events.push('finally');
      },
    });
    expect(events).toEqual(['try', 'finally']);
    expect(handled.unwrap()).toBe(42);
  });

  it('promotes synchronous work with asynchronous catch or cleanup', async () => {
    const failure = await tcf({
      try: () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- Verify arbitrary JavaScript throws.
        throw 'failure';
      },
      catch: (error) => Promise.resolve(mapError(error)),
    });
    expect(failure.isErr()).toBe(true);
    const cleanup = vi.fn(() => Promise.resolve());
    const success = tcf({ try: () => 42, catch: mapError, finally: cleanup });
    expectTypeOf(success).toEqualTypeOf<Promise<Result<number, Error>>>();
    expect((await success).unwrap()).toBe(42);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('handles synchronous throws from functions declared to return promises', async () => {
    const handled = tcf({
      try: (): Promise<number> => {
        throw new Error('early');
      },
      catch: mapError,
    });
    expectTypeOf(handled).toEqualTypeOf<Promise<Result<number, Error>> | Err<Error>>();
    expect((await handled).isErr()).toBe(true);
  });

  it('propagates failures in catch while running finally once', async () => {
    const cleanup = vi.fn();
    const failure = new Error('catch failed');
    expect(() =>
      tcf({
        try: () => {
          throw new Error('try');
        },
        catch: () => {
          throw failure;
        },
        finally: cleanup,
      }),
    ).toThrow(failure);
    expect(cleanup).toHaveBeenCalledOnce();
    cleanup.mockClear();
    await expect(
      tcf({
        try: () => Promise.reject(new Error('try')),
        catch: () => Promise.reject(failure),
        finally: cleanup,
      }),
    ).rejects.toBe(failure);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('lets cleanup errors override prior outcomes without invoking catch again', async () => {
    const failure = new Error('cleanup failed');
    const catcher = vi.fn(mapError);
    expect(() =>
      tcf({
        try: () => 42,
        catch: catcher,
        finally: () => {
          throw failure;
        },
      }),
    ).toThrow(failure);
    await expect(
      tcf({
        try: () => Promise.reject(new Error('try')),
        catch: catcher,
        finally: () => Promise.reject(failure),
      }),
    ).rejects.toBe(failure);
    expect(catcher).toHaveBeenCalledOnce();
  });

  it('assimilates thenables and cross-realm promises', async () => {
    const foreign = runInNewContext('Promise.reject("foreign")') as Promise<never>;
    expect((await tcf({ try: () => foreign, catch: mapError })).isErr()).toBe(true);
    const thenable: PromiseLike<number> = {
      then: (resolve, reject) => Promise.resolve(9).then(resolve, reject),
    };
    expect((await tcf({ try: () => thenable, catch: mapError })).unwrap()).toBe(9);
  });
});
