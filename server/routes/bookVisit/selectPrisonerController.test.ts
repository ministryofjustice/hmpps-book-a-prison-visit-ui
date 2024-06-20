import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import logger from '../../../logger'
import { Prisoner } from '../../services/bookerService'

jest.mock('../../../logger')

let app: Express
let sessionData: SessionData

afterEach(() => {
  jest.resetAllMocks()
})

describe('Select prisoner', () => {
  const bookerReference = TestData.bookerReference().value
  const prisoner = TestData.prisoner()
  const bookingConfirmed = TestData.bookingConfirmed()

  it('should use the session validation middleware', () => {
    sessionData = {
      booker: { reference: bookerReference },
    } as SessionData

    app = appWithAllRoutes({ services: {}, sessionData })

    return request(app)
      .post(paths.BOOK_VISIT.SELECT_PRISONER)
      .expect(302)
      .expect('Location', paths.HOME)
      .expect(res => {
        expect(logger.info).toHaveBeenCalledWith(expect.stringMatching('Session validation failed'))
      })
  })

  it('should clear any exiting bookingJourney session data, populate new data and redirect to select visitors page', () => {
    sessionData = {
      booker: { reference: bookerReference, prisoners: [prisoner] },
      bookingJourney: { prisoner: { prisonerNumber: 'OLD JOURNEY DATA' } as Prisoner },
      bookingConfirmed,
    } as SessionData

    app = appWithAllRoutes({ services: {}, sessionData })

    return request(app)
      .post(paths.BOOK_VISIT.SELECT_PRISONER)
      .send({ prisonerDisplayId: prisoner.prisonerDisplayId.toString() })
      .expect(302)
      .expect('location', paths.BOOK_VISIT.SELECT_VISITORS)
      .expect(() => {
        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
          bookingJourney: {
            prisoner,
          },
        } as SessionData)
      })
  })

  it('should reject an invalid prisoner number', () => {
    sessionData = {
      booker: { reference: bookerReference, prisoners: [prisoner] },
    } as SessionData

    app = appWithAllRoutes({ services: {}, sessionData })

    return request(app)
      .post(paths.BOOK_VISIT.SELECT_PRISONER)
      .send({ prisonerDisplayId: 1000 })
      .expect(404)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Prisoner not found')
        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
        } as SessionData)
      })
  })

  it('should redirect to Visit cannot be booked page if selected prisoner has no VOs', () => {
    const prisonerWithNoVos = TestData.prisoner({ availableVos: -1 })
    sessionData = {
      booker: { reference: bookerReference, prisoners: [prisonerWithNoVos] },
    } as SessionData

    app = appWithAllRoutes({ services: {}, sessionData })

    return request(app)
      .post(paths.BOOK_VISIT.SELECT_PRISONER)
      .send({ prisonerDisplayId: prisonerWithNoVos.prisonerDisplayId.toString() })
      .expect(302)
      .expect('location', paths.BOOK_VISIT.CANNOT_BOOK)
      .expect(() => {
        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisonerWithNoVos],
          },
          bookingJourney: {
            prisoner: prisonerWithNoVos,
          },
        } as SessionData)
      })
  })
})
