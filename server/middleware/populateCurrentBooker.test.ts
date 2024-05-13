import type { Request, Response } from 'express'
import { BadRequest, NotFound } from 'http-errors'
import { createMockBookerService } from '../services/testutils/mocks'
import TestData from '../routes/testutils/testData'
import populateCurrentBooker from './populateCurrentBooker'
import logger from '../../logger'

jest.mock('../../logger')

describe('populateCurrentBooker', () => {
  let req: Request
  let res: Response
  const next = jest.fn()

  const bookerService = createMockBookerService()

  beforeEach(() => {
    jest.resetAllMocks()

    req = { session: {} } as unknown as Request

    res = {
      locals: {
        user: {
          sub: 'user1',
          email: 'user1@example.com',
          phone_number: '+440123456789',
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  })

  it('should get booker reference and add to session if it is not already set', async () => {
    const bookerReference = TestData.bookerReference().value
    bookerService.getBookerReference.mockResolvedValue(bookerReference)

    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).toHaveBeenCalledWith({
      oneLoginSub: res.locals.user.sub,
      email: res.locals.user.email,
      phoneNumber: res.locals.user.phone_number,
    })
    expect(req.session).toStrictEqual({ booker: { reference: bookerReference } })
    expect(res.redirect).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should not get booker reference if it is already set in session', async () => {
    req.session.booker = { reference: TestData.bookerReference().value }

    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).not.toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should redirect to /sign-out if user details are not present in res.locals', async () => {
    delete res.locals.user
    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
    expect(next).not.toHaveBeenCalled()
  })

  it('should handle the booker not being found (404 error) by logging and redirecting to /autherror', async () => {
    bookerService.getBookerReference.mockRejectedValue(new NotFound())

    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).toHaveBeenCalledWith({
      oneLoginSub: res.locals.user.sub,
      email: res.locals.user.email,
      phoneNumber: res.locals.user.phone_number,
    })
    expect(res.redirect).toHaveBeenCalledWith('/autherror')
    expect(next).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith('Failed to retrieve booker reference for: user1')
  })

  it('should propagate any other errors', async () => {
    const error = new BadRequest('Oops!')
    bookerService.getBookerReference.mockRejectedValue(error)

    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).toHaveBeenCalledWith({
      oneLoginSub: res.locals.user.sub,
      email: res.locals.user.email,
      phoneNumber: res.locals.user.phone_number,
    })
    expect(res.redirect).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(error)
  })
})
