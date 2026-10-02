import type { Request, Response, NextFunction } from 'express'
import deprecatedSessionDataMapper from './deprecatedSessionDataMapper'

describe('deprecatedSessionDataMapper middleware', () => {
  it('should map bookVisitJourney.prison to bookVisitJourney.prisonId', () => {
    const req = {
      session: {
        bookVisitJourney: {
          prison: { code: 'HEI' },
        },
      },
    } as unknown as Request
    const res = {} as Response
    const next = jest.fn() as NextFunction

    deprecatedSessionDataMapper()(req, res, next)

    expect(req.session.bookVisitJourney!.prisonId).toBe('HEI')
    expect(next).toHaveBeenCalled()
  })

  it('should map bookVisitConfirmed.prison to bookVisitConfirmed.prisonId', () => {
    const req = {
      session: {
        bookVisitConfirmed: {
          prison: { code: 'HEI' },
        },
      },
    } as unknown as Request
    const res = {} as Response
    const next = jest.fn() as NextFunction

    deprecatedSessionDataMapper()(req, res, next)

    expect(req.session.bookVisitConfirmed!.prisonId).toBe('HEI')
    expect(next).toHaveBeenCalled()
  })
})

it('should call next even if no deprecated prison properties are present', () => {
  const req = {
    session: {},
  } as unknown as Request
  const res = {} as Response
  const next = jest.fn() as NextFunction

  deprecatedSessionDataMapper()(req, res, next)

  expect(next).toHaveBeenCalled()
})
