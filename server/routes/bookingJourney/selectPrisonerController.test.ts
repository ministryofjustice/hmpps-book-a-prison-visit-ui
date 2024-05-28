import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { PrisonerInfoDto } from '../../data/orchestrationApiTypes'

let app: Express
let sessionData: SessionData

afterEach(() => {
  jest.resetAllMocks()
})

describe('Select prisoner', () => {
  const bookerReference = TestData.bookerReference().value
  const prisoner = TestData.prisoner()

  it('should clear any exiting bookingJourney session data, populate new data and redirect to select visitors page', () => {
    sessionData = {
      booker: { reference: bookerReference, prisoners: [prisoner] },
      bookingJourney: { prisoner: { prisonerNumber: 'OLD JOURNEY DATA' } as PrisonerInfoDto },
    } as SessionData

    app = appWithAllRoutes({ services: {}, sessionData })

    return request(app)
      .post('/book-a-visit/select-prisoner')
      .send({ prisonerDisplayId: prisoner.prisonerDisplayId.toString() })
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
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
      .post('/book-a-visit/select-prisoner')
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
})
