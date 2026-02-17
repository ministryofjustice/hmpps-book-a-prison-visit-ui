import type { Request, Response } from 'express'
import { BadRequest } from 'http-errors'
import { SessionData } from 'express-session'
import { createMockBookerService } from '../services/testutils/mocks'
import TestData from '../routes/testutils/testData'
import populateCurrentBooker from './populateCurrentBooker'
import logger from '../../logger'
import paths from '../constants/paths'

jest.mock('../../logger')

describe('populateCurrentBooker', () => {
  let req: Request
  let res: Response
  const next = jest.fn()

  const bookerReference = TestData.bookerReference().value
  const prisoners = [TestData.prisoner()]

  const bookerService = createMockBookerService()

  beforeEach(() => {
    jest.resetAllMocks()

    req = { path: '/test', session: {} } as unknown as Request

    res = {
      locals: {
        user: {
          sub: 'urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=',
          email: 'test@example.com',
          phone_number: '07123456789',
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  })

  it('should get booker reference and prisoners and add to session if it is not already set', async () => {
    bookerService.getBookerReference.mockResolvedValue(bookerReference)
    bookerService.getPrisoners.mockResolvedValue(prisoners)

    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).toHaveBeenCalledWith({
      oneLoginSub: res.locals.user.sub,
      email: res.locals.user.email,
      phoneNumber: res.locals.user.phone_number,
    })
    expect(bookerService.getPrisoners).toHaveBeenCalledWith(bookerReference)
    expect(req.session).toStrictEqual(<SessionData>{ booker: { reference: bookerReference, prisoners } })
    expect(res.redirect).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should get booker reference and NOT prisoners and add to session if it is not already set - HOME page only', async () => {
    bookerService.getBookerReference.mockResolvedValue(bookerReference)
    req = { path: paths.HOME, session: {} } as unknown as Request

    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).toHaveBeenCalled()
    expect(bookerService.getPrisoners).not.toHaveBeenCalled()
    expect(req.session).toStrictEqual(<SessionData>{ booker: { reference: bookerReference, prisoners: [] } })
    expect(res.redirect).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should not get booker reference if it is already set in session', async () => {
    req.session.booker = { reference: bookerReference, prisoners }

    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).not.toHaveBeenCalled()
    expect(bookerService.getPrisoners).not.toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should redirect to /sign-out if user details are not present in res.locals', async () => {
    delete res.locals.user
    await populateCurrentBooker(bookerService)(req, res, next)

    expect(bookerService.getBookerReference).not.toHaveBeenCalled()
    expect(bookerService.getPrisoners).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith(paths.SIGN_OUT)
    expect(next).not.toHaveBeenCalled()
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
