import type { Request, Response } from 'express'
import setCurrentUrl from './setCurrentUrl'
import config from '../config'

describe('setCurrentUrl middleware', () => {
  it('sets the current URLs with en/cy query param on res.locals', () => {
    const req = {
      originalUrl: '/test?foo=bar',
      protocol: 'http',
    } as unknown as Request

    const res = {
      locals: {},
    } as Response

    const next = jest.fn()

    setCurrentUrl()(req, res, next)

    expect(res.locals.currentUrlEn.toString()).toBe(`${config.domain}/test?foo=bar&lng=en`)
    expect(res.locals.currentUrlCy.toString()).toBe(`${config.domain}/test?foo=bar&lng=cy`)
    expect(next).toHaveBeenCalled()
  })
})
