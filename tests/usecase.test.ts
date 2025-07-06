import { err } from '@/return/err'
import { ok } from '@/return/ok'
import { describe, it, expect } from 'vitest'

describe("function with only ok", () => {
  function doSomething(value: number) {
    if (value > 0 ) {
      return ok(value)
    }
    return ok("Value is not positive")
  }

  it("should return an ok type", () => {
    const result = doSomething(1)
    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    expect(result.value).toBe(1)
    expect(result.match(v => v, e => e)).toBe(1)
    const r = result.match(v => v, e => e)
    expect(r).toBe(1)
    expect(result.pair()).toEqual([1, undefined])
    const [value, error] = result.pair()
    expect(value).toBe(1)
    expect(error).toBeUndefined()
    expect(result.unwrap()).toBe(1)
  })

  it("should return a string ok type", () => {
    const result = doSomething(0)
    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    expect(result.value).toBe("Value is not positive")
    expect(result.match(v => v)).toBe("Value is not positive")
  })
})

describe("function with only err", () => {
  function doSomething(value: number) {
    if (value > 0 ) {
      return err(new Error("Value is positive"))
    }
    return err(new Error("Value is not positive"))
  }

  it("should return an err type", () => {
    const result = doSomething(0)
    const result2 = doSomething(1)
    expect(result.isOk()).toBe(false)
    expect(result.isErr()).toBe(true)
    expect(result.error).toStrictEqual(new Error("Value is not positive"))
    expect(result2.isOk()).toBe(false)
    expect(result2.isErr()).toBe(true)
    const r1 = result.match(v => v, e => e)
    const r2 = result2.match(v => v, e => e)
    expect(r1).toStrictEqual(new Error("Value is not positive"))
    expect(r2).toStrictEqual(new Error("Value is positive"))
    expect(result2.error).toStrictEqual(new Error("Value is positive"))
    const [value, error] = result.pair()
    expect(value).toBeUndefined()
    expect(error).toStrictEqual(new Error("Value is not positive"))
    const [value2, error2] = result2.pair()
    expect(value2).toBeUndefined()
    expect(error2).toStrictEqual(new Error("Value is positive"))
    expect(result.unwrap()).toStrictEqual(new Error("Value is not positive"))
    expect(result2.unwrap()).toStrictEqual(new Error("Value is positive"))
  })
})

describe("function call with ok and err types", () => {
  function doSomething(value: number) {
    if (value > 0) {
      return ok(value)
    }
    return err(new Error("Value is not positive"))
  }

  it("match differentiates", () => {
    const result = doSomething(0)
    const r = result.match(v => v + 1, e => e.message)
    expect(r).toBe("Value is not positive")
  })

  it("should return an ok type", () => {
    const result = doSomething(1)
    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    if (result.isOk()) {
      expect(result.value).toBe(1)
    } else {
      expect(result.error).toBe(new Error("Value is not positive"))
    }
    expect(result.match(v => v, e => e)).toBe(1)
    result.match(v => v, e => e)
    const r = result.match(v => v, e => e)
    expect(r).toBe(1)
    const [value, error] = result.pair()
    expect(value).toBe(1)
    expect(error).toBeUndefined()
    expect(result.unwrap()).toBe(1)
  })

  it("should return an err type", () => {
    const result = doSomething(0)
    expect(result.isOk()).toBe(false)
    expect(result.isErr()).toBe(true)
    expect(result.match(v => v, e => e)).toStrictEqual(new Error("Value is not positive"))
    const r = result.match(v => v, e => e)
    expect(r).toStrictEqual(new Error("Value is not positive"))
    expect(result.unwrap()).toStrictEqual(new Error("Value is not positive"))
  })

  it("should return an ok type with a promise", async () => {
    const result = doSomething(1)
    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    expect(await result.match(v => v, e => e)).toBe(1)

    const matched = await result.match(v => v, e => e)
    expect(matched).toBe(1)
    expect(result.unwrap()).toBe(1)
  })

  it("should return an err type with a promise", async () => {
    const result = doSomething(0)
    expect(result.isOk()).toBe(false)
    expect(result.isErr()).toBe(true)
    expect(await result.match(v => v, e => e)).toStrictEqual(new Error("Value is not positive"))
    expect(result.unwrap()).toStrictEqual(new Error("Value is not positive"))
  })
})
