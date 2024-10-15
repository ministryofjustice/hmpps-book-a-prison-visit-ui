import type { Request, Response } from 'express'
import analyticsConsent from './analyticsConsent'

describe('analyticsConsent', () => {
  let req: Request
  let res: Response
  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()

    req = {} as Request

    res = {
      locals: {},
    } as Response
  })

  it('should set res.locals.analyticsEnabled to true if consent cookie set to yes', async () => {
    req.cookies = { cookie_policy: encodeURIComponent(JSON.stringify({ acceptAnalytics: 'yes' })) }

    await analyticsConsent()(req, res, next)

    expect(res.locals.analyticsEnabled).toBe(true)
    expect(next).toHaveBeenCalled()
  })

  it('should set res.locals.analyticsEnabled to false if consent cookie set to no', async () => {
    req.cookies = { cookie_policy: encodeURIComponent(JSON.stringify({ acceptAnalytics: 'no' })) }

    await analyticsConsent()(req, res, next)

    expect(res.locals.analyticsEnabled).toBe(false)
    expect(next).toHaveBeenCalled()
  })

  it('should set res.locals.analyticsEnabled to undefined if consent cookie set to invalid value', async () => {
    req.cookies = { cookie_policy: 'NOT-A-JSON-STRING' }

    await analyticsConsent()(req, res, next)

    expect(res.locals.analyticsEnabled).toBe(undefined)
    expect(next).toHaveBeenCalled()
  })

  it('should set res.locals.analyticsEnabled to undefined if consent cookie is not set', async () => {
    req.cookies = undefined

    await analyticsConsent()(req, res, next)

    expect(res.locals.analyticsEnabled).toBe(undefined)
    expect(next).toHaveBeenCalled()
  })
})
