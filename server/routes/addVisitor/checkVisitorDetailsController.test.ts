import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import paths from '../../constants/paths'
import { disableFeatureForTest, enableFeatureForTest } from '../../data/testutils/mockFeatureFlags'
import { createMockBookerService } from '../../services/testutils/mocks'
import { BookerService } from '../../services'

let app: Express

const bookerService = createMockBookerService()
let sessionData: SessionData

beforeEach(() => {
  enableFeatureForTest('addVisitor')

  sessionData = {
    addVisitorJourney: {
      visitorDetails: {
        firstName: 'first',
        lastName: 'last',
        'visitorDob-day': '1',
        'visitorDob-month': '2',
        'visitorDob-year': '2000',
        visitorDob: '2000-02-01',
      },
    },
  } as SessionData

  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Check visitor request details', () => {
  describe(`GET ${paths.ADD_VISITOR.CHECK}`, () => {
    it('should return a 404 if FEATURE_ADD_VISITOR is not enabled', () => {
      disableFeatureForTest('addVisitor')
      app = appWithAllRoutes({})

      return request(app).get(paths.ADD_VISITOR.CHECK).expect(404)
    })

    it('should render check visitor request page', () => {
      return request(app)
        .get(paths.ADD_VISITOR.CHECK)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Check your request -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.ADD_VISITOR.DETAILS)
          expect($('h1').text().trim()).toBe('Check your request')

          expect($('[data-test=change]').attr('href')).toBe(paths.ADD_VISITOR.DETAILS)
          expect($('[data-test=first-name]').text().trim()).toBe('first')
          expect($('[data-test=last-name]').text().trim()).toBe('last')
          expect($('[data-test=date-of-birth]').text().trim()).toBe('1/2/2000')
          expect($('[data-test=submit]').parent('form').attr('action')).toBe(paths.ADD_VISITOR.CHECK)
          expect($('[data-test=submit]').text().trim()).toBe('Accept and send')
        })
    })

    it('should return to visitor details page if no visitor request in session', () => {
      delete sessionData.addVisitorJourney
      return request(app).get(paths.ADD_VISITOR.CHECK).expect(302).expect('location', paths.ADD_VISITOR.DETAILS)
    })
  })

  describe(`POST ${paths.ADD_VISITOR.CHECK}`, () => {
    describe('Send visitor request', () => {
      it.each([
        ['request successful', 'REQUESTED', paths.ADD_VISITOR.SUCCESS],
        ['auto approval', 'AUTO_APPROVED', paths.ADD_VISITOR.AUTO_APPROVED],
        ['too many requests', 'MAX_IN_PROGRESS_REQUESTS_REACHED', paths.ADD_VISITOR.FAIL_TOO_MANY_REQUESTS],
        ['request already exists', 'REQUEST_ALREADY_EXISTS', paths.ADD_VISITOR.FAIL_ALREADY_REQUESTED],
        ['visitor already linked', 'VISITOR_ALREADY_EXISTS', paths.ADD_VISITOR.FAIL_ALREADY_LINKED],
        ['prisoner not found', 'PRISONER_NOT_FOUND_FOR_BOOKER', paths.HOME],
      ])('%s', (_: string, apiResponse: unknown, redirectPath: string) => {
        bookerService.addVisitorRequest.mockResolvedValue(
          apiResponse as unknown as ReturnType<BookerService['addVisitorRequest']>,
        )

        return request(app)
          .post(paths.ADD_VISITOR.CHECK)
          .expect(302)
          .expect('Location', redirectPath)
          .expect(() => {
            expect(sessionData.addVisitorJourney.result).toBe(apiResponse)
            expect(bookerService.addVisitorRequest).toHaveBeenCalledWith({
              bookerReference: 'aaaa-bbbb-cccc',
              prisonerId: 'A1234BC',
              addVisitorRequest: {
                firstName: 'first',
                lastName: 'last',
                dateOfBirth: '2000-02-01',
              },
            })
          })
      })
    })

    it('should return to visitors page if no visitor request in session', () => {
      delete sessionData.addVisitorJourney
      return request(app).post(paths.ADD_VISITOR.CHECK).expect(302).expect('location', paths.VISITORS)
    })

    it('should return to visitors page if booker has no prisoner', () => {
      sessionData.booker = { reference: 'ref', prisoners: [] }
      return request(app).post(paths.ADD_VISITOR.CHECK).expect(302).expect('location', paths.VISITORS)
    })
  })
})
