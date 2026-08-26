import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { randomUUID } from 'crypto'
import { FieldValidationError } from 'express-validator'
import { appWithAllRoutes, flashProvider } from '../../testutils/appSetup'
import { createMockBookerService } from '../../../services/testutils/mocks'
import TestData from '../../testutils/testData'
import paths from '../../../constants/paths'
import { VisitorRequest } from '../../../services/bookerService'

let app: Express

const bookerService = createMockBookerService()

const visitorRequestDisplayId = randomUUID()
const url = `${paths.CANCEL_VISITOR_REQUEST.CANCEL}/${visitorRequestDisplayId}`

let sessionData: SessionData
let visitorRequest: VisitorRequest

beforeEach(() => {
  visitorRequest = TestData.visitorRequest({ visitorRequestDisplayId })

  sessionData = {
    visitorRequests: [visitorRequest],
  } as SessionData

  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Cancel a visitor request - Are you sure page', () => {
  describe('GET - Display visitor request information on cancellation page', () => {
    it('should render the cancel visitor request confirmation page', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Cancel your visitor link request -/)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.VISITORS)
          expect($('h1').text()).toBe('Are you sure you want to cancel your request?')

          expect($('[data-test="visitor-name"]').text()).toBe('Joan Phillips')
          expect($('[data-test="visitor-date-of-birth"]').text()).toBe('21 February 1980')
          expect($('input[value="yes"]').length).toBe(1)
          expect($('input[value="no"]').length).toBe(1)

          expect($('form[method=POST]').attr('action')).toBe(url)
        })
    })
  })

  describe('POST - cancel visitor request', () => {
    it('should cancel the visitor request and redirect to confirmation page if "yes" selected', () => {
      return request(app)
        .post(url)
        .send('cancelVisitorRequest=yes')
        .expect(302)
        .expect('location', paths.CANCEL_VISITOR_REQUEST.CANCEL_CONFIRMATION)
        .expect(() => {
          expect(bookerService.withdrawVisitorRequest).toHaveBeenCalledWith({
            bookerReference: TestData.bookerReference().value,
            requestReference: visitorRequest.reference,
          })
        })
    })

    it('should redirect to visitors page if "no" is selected', () => {
      return request(app)
        .post(url)
        .send('cancelVisitorRequest=no')
        .expect(302)
        .expect('location', paths.VISITORS)
        .expect(() => {
          expect(bookerService.withdrawVisitorRequest).toHaveBeenCalledTimes(0)
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'information',
            title: 'Your request needs to be reviewed.',
            showTitleAsHeading: true,
            text: 'Your visitor needs to be checked by Hewell (HMP & YOI).',
          })
        })
    })

    it('should NOT redirect when no value posted', () => {
      const expectedValidationError: FieldValidationError = {
        location: 'body',
        msg: 'No answer selected',
        path: 'cancelVisitorRequest',
        type: 'field',
        value: undefined,
      }
      return request(app)
        .post(url)
        .expect(302)
        .expect('location', url)
        .expect(() => {
          expect(bookerService.withdrawVisitorRequest).toHaveBeenCalledTimes(0)
          expect(flashProvider).toHaveBeenCalledWith('errors', [expectedValidationError])
        })
    })

    it('should NOT cancel the visitor request if invalid request ID is posted', () => {
      return request(app)
        .post(`${paths.CANCEL_VISITOR_REQUEST.CANCEL}/${randomUUID()}`)
        .send('cancelVisitorRequest=yes')
        .expect(302)
        .expect('location', paths.VISITORS)
        .expect(() => {
          expect(bookerService.withdrawVisitorRequest).toHaveBeenCalledTimes(0)
        })
    })
  })
})
