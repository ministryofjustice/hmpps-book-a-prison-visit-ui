import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createMockBookerService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'

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

describe('Visitors page', () => {
  it('should redirect to home page if no prisoner details in session', () => {
    sessionData.booker.prisoners = undefined
    return request(app)
      .get(paths.VISITORS)
      .expect(302)
      .expect('location', paths.HOME)
      .expect(res => {
        expect(bookerService.getVisitors).not.toHaveBeenCalled()
      })
  })

  it('should render the visitors page with all visitors associated with the booker', () => {
    bookerService.getVisitors.mockResolvedValue([visitor])

    return request(app)
      .get(paths.VISITORS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visitors -/)
        expect($('h1').text()).toBe('Visitors')

        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('[data-test="visitor-name-1"]').text()).toBe('Joan Phillips')
        expect($('[data-test="visitor-dob-1"]').text()).toBe('21 February 1980')
        expect($('[data-test=no-visitors]').length).toBe(0)

        expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
      })
  })

  it('should render the visitor page with message when booker has no associated visitors', () => {
    bookerService.getVisitors.mockResolvedValue([])

    return request(app)
      .get(paths.VISITORS)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('title').text()).toMatch(/^Visitors -/)
        expect($('h1').text()).toBe('Visitors')

        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('[data-test="visitor-name-1"]').length).toBe(0)
        expect($('[data-test=no-visitors]').text().trim()).toInclude('Warning')
        expect($('[data-test=no-visitors]').text().trim()).toInclude('No visitors are currently approved.')
      
        expect(bookerService.getVisitors).toHaveBeenCalledWith(bookerReference, prisoner.prisonerNumber)
      })
  })
})
