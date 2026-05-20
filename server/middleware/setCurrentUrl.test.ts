import type { Request, Response } from 'express'
import setCurrentUrl from './setCurrentUrl'

describe('setCurrentUrl middleware', () => {
  it('sets the current URLs with en/cy query param on res.locals', () => {
    const req = {
      originalUrl: '/test?foo=bar',
      protocol: 'http',
      get: () => 'example.com',
    } as unknown as Request

    const res = {
      locals: {},
    } as Response

    const next = jest.fn()

    setCurrentUrl()(req, res, next)

    expect(res.locals.currentUrlEn.toString()).toBe('http://example.com/test?foo=bar&lng=en')
    expect(res.locals.currentUrlCy.toString()).toBe('http://example.com/test?foo=bar&lng=cy')
    expect(next).toHaveBeenCalled()
  })
})
