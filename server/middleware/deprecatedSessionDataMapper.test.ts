import type { Request, Response, NextFunction } from 'express'
import deprecatedSessionDataMapper from './deprecatedSessionDataMapper'
import { createMockPrisonService } from '../services/testutils/mocks'
import { PrisonDto } from '../data/orchestrationApiTypes'

const prisonService = createMockPrisonService()
prisonService.getPrison.mockResolvedValue({ code: 'HEI' } as PrisonDto)

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

    deprecatedSessionDataMapper(prisonService)(req, res, next)

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

    deprecatedSessionDataMapper(prisonService)(req, res, next)

    expect(req.session.bookVisitConfirmed!.prisonId).toBe('HEI')
    expect(next).toHaveBeenCalled()
  })

  it('should map bookVisitJourney.prisonId to bookVisitJourney.prison', async () => {
    const req = {
      session: {
        bookVisitJourney: {
          prisonId: 'HEI',
        },
      },
    } as unknown as Request
    const res = {} as Response
    const next = jest.fn() as NextFunction

    await deprecatedSessionDataMapper(prisonService)(req, res, next)

    expect(req.session.bookVisitJourney!.prison).toEqual({ code: 'HEI' })
    expect(next).toHaveBeenCalled()
  })

  it('should map bookVisitConfirmed.prisonId to bookVisitConfirmed.prison', async () => {
    const req = {
      session: {
        bookVisitConfirmed: {
          prisonId: 'HEI',
        },
      },
    } as unknown as Request
    const res = {} as Response
    const next = jest.fn() as NextFunction

    await deprecatedSessionDataMapper(prisonService)(req, res, next)

    expect(req.session.bookVisitConfirmed!.prison).toEqual({ code: 'HEI' })
    expect(next).toHaveBeenCalled()
  })
})

it('should call next even if no deprecated prison properties are present', () => {
  const req = {
    session: {},
  } as unknown as Request
  const res = {} as Response
  const next = jest.fn() as NextFunction

  deprecatedSessionDataMapper(prisonService)(req, res, next)

  expect(next).toHaveBeenCalled()
})
