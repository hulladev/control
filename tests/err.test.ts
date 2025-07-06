import { never } from '@/lib/never'
import { err } from '../src/return/err'
import { describe, it, expect } from 'vitest'

describe('err', () => {
  class CustomError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'CustomError'
    }
  }

  it('should return an Err type', () => {
    const error = new CustomError('test error')
    const result = err(error)
    expect(result.isOk()).toBe(false)
    expect(result.isErr()).toBe(true)
    expect(result.match(never, e => e.message)).toBe('test error')
  })

  it('should return a Tagged Err type', () => {
    const error = new CustomError('test error')
    const result = err(error, 'customError')
    expect(result.isOk()).toBe(false)
    expect(result.isErr()).toBe(true)
    expect(result.tag).toBe('customError')
  })

  it('should handle promises in match', async () => {
    const promise = Promise.resolve(new CustomError('async error'))
    const result = err(promise)
    expect(result.isErr()).toBe(true)
    expect(await result.match(
      never,
      e => e.message
    )).toBe('async error')
  })

  it('should return a pair with undefined value and error', () => {
    const error = new CustomError('test error')
    const result = err(error)
    const pair = result.pair()
    expect(pair).toEqual([undefined, error])
  })

  it('should return a pair with promise', async () => {
    const promise = Promise.resolve(new CustomError('async error'))
    const result = err(promise)
    const t = await result.match(never, e => e.message)
    expect(t).toBe('async error')

    const [value, error] = await result.pair()
    expect(value).toBeUndefined()
    expect(error.message).toBe('async error')
  })
}) 