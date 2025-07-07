import { describe, it, expect } from 'vitest'
import { result } from '@/return/result'

describe('result function', () => {
  describe('basic functionality', () => {
    it('should handle normal values', () => {
      const value = 42
      const r = result(value)
      expect(r.isOk()).toBe(true)
      expect(r.unwrap()).toBe(42)
    })

    it('should handle Error instances', () => {
      const error = new Error('test error')
      const r = result<any, Error>(error)
      expect(r.isErr()).toBe(true)
      expect(r.unwrap()).toBe(error)
    })
  })

  describe('custom error detection', () => {
    class ValidationError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
      }
    }

    it('should work with custom error detection', () => {
      const isValidationError = (v: unknown): v is ValidationError => v instanceof ValidationError
      const error = new ValidationError('invalid')
      const r = result<any, ValidationError>(error, { isError: isValidationError })
      expect(r.isErr()).toBe(true)
      expect(r.unwrap()).toBe(error)
    })
  })

  describe('custom tags', () => {
    it('should support tagOk for success values', () => {
      const value = 42
      const r = result(value, { tagOk: 'SUCCESS' })
      expect(r.isOk()).toBe(true)
      expect(r.unwrap()).toBe(42)
      expect(r.tag).toBe('SUCCESS')
    })

    it('should support tagError for error values', () => {
      const error = new Error('test error')
      const r = result(error, { tagError: 'FAILURE' })
      expect(r.isErr()).toBe(true)
      expect(r.unwrap()).toBe(error)
      expect(r.tag).toBe('FAILURE')
    })

    it('should support both tagOk and tagError', () => {
      const value = 42
      const successResult = result(value, { tagOk: 'SUCCESS', tagError: 'FAILURE' })
      expect(successResult.isOk()).toBe(true)
      expect(successResult.tag).toBe('SUCCESS')

      const error = new Error('test error')
      const errorResult = result(error, { tagOk: 'SUCCESS', tagError: 'FAILURE' })
      expect(errorResult.isErr()).toBe(true)
      expect(errorResult.tag).toBe('FAILURE')
    })
  })

  describe('error type discrimination', () => {
    class ValidationError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
      }
    }

    class NetworkError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'NetworkError'
      }
    }

    class DatabaseError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'DatabaseError'
      }
    }

    it('should handle single specific error type', () => {
      const error = new ValidationError('invalid input')
      const r = result<any, ValidationError>(error)
      expect(r.isErr()).toBe(true)
      expect(r.unwrap()).toBeInstanceOf(ValidationError)
      expect(r.unwrap().name).toBe('ValidationError')
    })

    it('should handle union of error types', () => {
      const getError = (type: 'validation' | 'network'): ValidationError | NetworkError => {
        return type === 'validation'
          ? new ValidationError('invalid input')
          : new NetworkError('connection failed')
      }

      const r1 = result<any, ValidationError | NetworkError>(getError('validation'))
      expect(r1.isErr()).toBe(true)
      expect(r1.unwrap()).toBeInstanceOf(ValidationError)

      const r2 = result<any, ValidationError | NetworkError>(getError('network'))
      expect(r2.isErr()).toBe(true)
      expect(r2.unwrap()).toBeInstanceOf(NetworkError)
    })

    it('should handle custom error type guard with multiple types', () => {
      type AppError = ValidationError | NetworkError | DatabaseError
      const isAppError = (v: unknown): v is AppError =>
        v instanceof ValidationError || v instanceof NetworkError || v instanceof DatabaseError

      const errors = [
        new ValidationError('invalid input'),
        new NetworkError('connection failed'),
        new DatabaseError('query failed')
      ]

      errors.forEach(error => {
        const r = result<any, AppError>(error, {
          isError: isAppError
        })
        expect(r.isErr()).toBe(true)
        expect(r.unwrap()).toBe(error)
        expect(['ValidationError', 'NetworkError', 'DatabaseError']).toContain(r.unwrap().name)
      })
    })

    it('should handle error type discrimination with tags', () => {
      type AppError = ValidationError | NetworkError
      const isAppError = (v: unknown): v is AppError =>
        v instanceof ValidationError || v instanceof NetworkError

      const error = new ValidationError('invalid input')
      const r = result<any, AppError, "APP_ERROR">(error, {
        isError: isAppError,
        tagError: 'APP_ERROR'
      })

      expect(r.isErr()).toBe(true)
      expect(r.unwrap()).toBeInstanceOf(ValidationError)
      expect(r.unwrap().name).toBe('ValidationError')
      expect(r.tag).toBe('APP_ERROR')
    })
  })
}) 