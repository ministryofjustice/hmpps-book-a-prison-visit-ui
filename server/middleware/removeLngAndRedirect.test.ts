import type { Request, Response } from 'express'
import removeLngAndRedirect from './removeLngAndRedirect'

describe('removeLngAndRedirect middleware', () => {
  const mockReq = (originalUrl: string, query: Record<string, string> = {}): Request =>
    ({
      originalUrl,
      query,
      protocol: 'http',
      get: () => 'localhost',
    }) as unknown as Request

  const res = {
    redirect: jest.fn(),
  } as unknown as Response

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should redirect to the same URL without the lng query parameter', () => {
    const req = mockReq('/some-path?lng=en&foo=bar', { lng: 'en', foo: 'bar' })
    const next = jest.fn()

    removeLngAndRedirect()(req, res, next)

    expect(res.redirect).toHaveBeenCalledWith('/some-path?foo=bar')
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next if there is no lng query parameter', () => {
    const req = mockReq('/some-path?foo=bar', { foo: 'bar' })
    const next = jest.fn()

    removeLngAndRedirect()(req, res, next)

    expect(res.redirect).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
