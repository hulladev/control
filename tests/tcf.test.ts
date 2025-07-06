import { tcf } from '../src/return/tcf'
import { describe, it, expect } from 'vitest'

describe('tcf', () => {
  class CustomError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'CustomError'
    }
  }

  class HandledError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'HandledError'
    }
  }

  it('should return Ok when try succeeds', () => {
    const result = tcf({
      try: () => 'success',
      catch: (error: CustomError) => new HandledError(error.message),
    })

    expect(result.isOk()).toBe(true)
    expect(result.isErr()).toBe(false)
    expect(result.match(v => v, () => null)).toBe('success')
  })

  it('should return Err when try fails', () => {
    const result = tcf({
      try: () => { throw new CustomError('test error') },
      catch: (error: CustomError) => new HandledError(error.message),
    })

    expect(result.isOk()).toBe(false)
    expect(result.isErr()).toBe(true)
    expect(result.match(
      v => v,
      e => e.message
    )).toBe('test error')
  })

  it('should handle promises in try', async () => {
    const result = tcf({
      try: () => Promise.resolve('async success'),
      catch: (error: CustomError) => new HandledError(error.message),
    })

    expect(result.isOk()).toBe(true)
    expect(await result.match(v => v, () => null)).toBe('async success')
  })

  it('should handle promises in catch', async () => {
    const result = tcf({
      try: () => { throw new CustomError('async error') },
      catch: async (error: CustomError) => new HandledError(await Promise.resolve(error.message)),
    })

    expect(result.isErr()).toBe(true)
    expect(await result.match(
      v => v,
      e => e.message
    )).toBe('async error')
  })

  it('should execute finally block', () => {
    let finallyCalled = false
    
    tcf({
      try: () => 'success',
      catch: (error: CustomError) => new HandledError(error.message),
      finally: () => { finallyCalled = true },
    })

    expect(finallyCalled).toBe(true)
  })

  it('should support tagged Ok result', () => {
    const result = tcf({
      try: () => 'success',
      catch: (error: CustomError) => new HandledError(error.message),
      tagOk: 'successTag',
    })

    expect(result.isOk()).toBe(true)
    expect(result.tag).toBe('successTag')
    expect(result.match(v => v, () => null)).toBe('success')
  })

  it('should support tagged Err result', () => {
    const result = tcf({
      try: () => { throw new CustomError('test error') },
      catch: (error: CustomError) => new HandledError(error.message),
      tagError: 'errorTag',
    })

    expect(result.isErr()).toBe(true)
    expect(result.tag).toBe('errorTag')
    expect(result.match(
      v => v,
      e => e.message
    )).toBe('test error')
  })

  it('should execute finally block even when try fails', () => {
    let finallyCalled = false
    
    tcf({
      try: () => { throw new CustomError('test error') },
      catch: (error: CustomError) => new HandledError(error.message),
      finally: () => { finallyCalled = true },
    })

    expect(finallyCalled).toBe(true)
  })

  it('should handle pair method for Ok result', () => {
    const result = tcf({
      try: () => 'success',
      catch: (error: CustomError) => new HandledError(error.message),
    })

    const [value, error] = result.pair()
    expect(value).toBe('success')
    expect(error).toBeUndefined()
  })

  it('should handle pair method for Err result', () => {
    const result = tcf({
      try: () => { throw new CustomError('test error') },
      catch: (error: CustomError) => new HandledError(error.message),
    })

    const [value, error] = result.pair()
    expect(value).toBeUndefined()
    expect(error).toBeInstanceOf(HandledError)
    expect(error?.message).toBe('test error')
  })

  it("should support tagging", () => {
    const result = tcf({
      try: () => 'success',
      catch: (error: CustomError) => new HandledError(error.message),
      tagOk: 'successTag',
      tagError: 'errorTag',
    })

    expect(result.tag).toBe('successTag')
  })
}) 