import { ok } from '../src/return/ok'
import { describe, it, expect } from 'vitest'

describe('ok', () => {
  it('should return an Ok type', () => {
    const result = ok(1)
    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    expect(result.match(v => v)).toBe(1)
    expect(result.unwrap()).toBe(1)
  })

  it('should return a Tagged Ok type', () => {
    const result = ok(1, 'number')
    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    expect(result.match(v => v)).toBe(1)
  })

  it("promises should be awaited", async () => {
    const promise = Promise.resolve(1)
    const result = ok(promise)
    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    expect(await result.match(v => v)).toBe(1)
    
    const matched = await result.match(v => v)
    expect(matched).toBe(1)

    // Test chaining promises
    const chainedResult = ok(Promise.resolve(1))
    const nextResult = await chainedResult.match(
      v => ok(Promise.resolve(v + 1)),
    )
    expect(await nextResult.match(v => v)).toBe(2)
  })

  it("should return a pair", () => {
    const result = ok(1)
    const pair = result.pair()
    expect(pair).toEqual([1, undefined])
  })

  it("should return a pair with a promise", async () => {
    const result = ok(Promise.resolve(1))
    const pair = await result.pair()
    expect(pair).toEqual([1, undefined])

    const [value, error] = pair
    if (error) {
      throw error
    }
    expect(value).toBe(1)
    expect(result.unwrap()).resolves.toBe(1)
  })
})  