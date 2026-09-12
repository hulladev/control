import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
for (const api of [await import('@hulla/control'), require('@hulla/control')]) {
  assert.equal(api.ok(42).tag, 'ok');
  assert.equal(api.err('failure').tag, 'error');
  assert.deepEqual(api.result(42).pair(), [42, undefined]);
  assert.equal(
    api
      .ok(21)
      .map((value) => value * 2)
      .unwrap(),
    42,
  );
  assert.equal(
    api
      .err('offline')
      .mapErr((message) => message.toUpperCase())
      .unwrap(),
    'OFFLINE',
  );
  assert.deepEqual(
    await api
      .ok(Promise.resolve(21))
      .map((value) => value * 2)
      .pair(),
    [42, undefined],
  );
  const failure = new Error('rejected');
  const handled = await api.tcf({
    try: () => Promise.reject(failure),
    catch: (error) => error,
  });
  assert.equal(handled.isErr(), true);
  assert.equal(handled.unwrap(), failure);
}
