import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from './testutils/appSetup'
import { createMockBookerService } from '../services/testutils/mocks'
import TestData from './testutils/testData'
import paths from '../constants/paths'

let app: Express

const bookerService = createMockBookerService()
let sessionData: SessionData

const bookerReference = TestData.bookerReference().value
const prisoner = TestData.prisoner()
const visitor = TestData.visitor()

beforeEach(() => {
  sessionData = {
    booker: {
      reference: bookerReference,
      prisoners: [prisoner],
    },
  } as SessionData
  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Home page', () => {
  it('should render the visitors page with the visitors associated with the booker', () => {
    bookerService.getVisitors.mockResolvedValue([visitor])

    return request(app)
      .get(paths.VISITORS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visitors you can book for -/)
        expect($('[data-test="back-link"]').length).toBe(1)
        expect($('h1').text()).toBe('Visitors you can book for')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('[data-test="visitor-name-1"]').text()).toBe('Joan Phillips')
        expect($('[data-test="visitor-date-of-birth-1"]').text()).toBe('21 February 1980')

        expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
        } as SessionData)
      })
  })

  it('should render the visitor page with message when booker has no associated visitors', () => {
    bookerService.getVisitors.mockResolvedValue([])

    return request(app)
      .get(paths.VISITORS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visitors you can book for -/)
        expect($('[data-test="back-link"]').length).toBe(1)
        expect($('h1').text()).toBe('Visitors you can book for')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('[data-test="visitor-name-1"]').length).toBe(0)
        expect($('[data-test=no-visitors]').text()).toBe('No visitor details found.')

        expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)

        expect(sessionData).toStrictEqual({
          booker: {
            reference: bookerReference,
            prisoners: [prisoner],
          },
        } as SessionData)
      })
  })
})
