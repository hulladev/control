import { result } from '@/return/result';
import { describe, expect, it } from 'vitest';

describe('result classification', () => {
  it('routes ordinary values to success and Error instances to failure', () => {
    const success = result(42);
    const error = new Error('offline');
    const failure = result(error);
    expect(success.isOk()).toBe(true);
    expect(success.unwrap()).toBe(42);
    expect(failure.isErr()).toBe(true);
    expect(failure.unwrap()).toBe(error);
  });

  it('uses a custom predicate instead of treating every Error as a failure', () => {
    class ValidationError extends Error {}
    class NetworkError extends Error {}
    type AppError = ValidationError | NetworkError;
    const isAppError = (value: unknown): value is AppError =>
      value instanceof ValidationError || value instanceof NetworkError;

    for (const error of [new ValidationError('invalid'), new NetworkError('offline')]) {
      const failure = result<Error, AppError>(error, { isError: isAppError });
      expect(failure.isErr()).toBe(true);
      expect(failure.unwrap()).toBe(error);
    }
    const ordinaryError = new Error('not an application failure');
    const success = result<Error, AppError>(ordinaryError, { isError: isAppError });
    expect(success.isOk()).toBe(true);
    expect(success.unwrap()).toBe(ordinaryError);
  });

  it('applies each configured tag to its branch without replacing the other default', () => {
    const error = new Error('offline');
    expect(result(42, { tagOk: 'SUCCESS' }).tag).toBe('SUCCESS');
    expect(result(error, { tagOk: 'SUCCESS' }).tag).toBe('error');
    expect(result(error, { tagError: 'FAILURE' }).tag).toBe('FAILURE');
    expect(result(42, { tagError: 'FAILURE' }).tag).toBe('ok');
    const config = { tagOk: 'SUCCESS', tagError: 'FAILURE' } as const;
    expect(result(42, config).tag).toBe('SUCCESS');
    expect(result(error, config).tag).toBe('FAILURE');
  });
});
