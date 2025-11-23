import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import paths from '../../constants/paths'
import { AddVisitorJourney, FlashFormValues } from '../../@types/bapv'
import { disableFeatureForTest, enableFeatureForTest } from '../../data/testutils/mockFeatureFlags'

let app: Express

let sessionData: SessionData

beforeEach(() => {
  enableFeatureForTest('addVisitor')

  sessionData = {} as SessionData

  app = appWithAllRoutes({ sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visitor details', () => {
  describe(`GET ${paths.ADD_VISITOR.DETAILS}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should return a 404 if FEATURE_ADD_VISITOR is not enabled', () => {
      disableFeatureForTest('addVisitor')
      app = appWithAllRoutes({})

      return request(app).get(paths.ADD_VISITOR.DETAILS).expect(404)
    })

    it('should render visitor information page', () => {
      return request(app)
        .get(paths.ADD_VISITOR.DETAILS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visitor information -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.ADD_VISITOR.START)
          expect($('h1').text().trim()).toBe('Visitor information')

          expect($('form[method=POST]').attr('action')).toBe(paths.ADD_VISITOR.DETAILS)
          expect($('input[name=firstName]').length).toBe(1)
          expect($('input[name=lastName]').length).toBe(1)
          expect($('input[name=visitorDob-day]').length).toBe(1)
          expect($('input[name=visitorDob-month]').length).toBe(1)
          expect($('input[name=visitorDob-year]').length).toBe(1)
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
        })
    })

    it('should pre-populate with data in session', () => {
      sessionData.addVisitorJourney = {
        visitorDetails: {
          firstName: 'first',
          lastName: 'last',
          'visitorDob-day': '1',
          'visitorDob-month': '2',
          'visitorDob-year': '2000',
          visitorDob: '2000-02-01',
        },
      }

      return request(app)
        .get(paths.ADD_VISITOR.DETAILS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=firstName]').val()).toBe('first')
          expect($('input[name=lastName]').val()).toBe('last')
          expect($('input[name=visitorDob-day]').val()).toBe('1')
          expect($('input[name=visitorDob-month]').val()).toBe('2')
          expect($('input[name=visitorDob-year]').val()).toBe('2000')
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.addVisitorJourney = {
        visitorDetails: {
          firstName: 'first-session',
        },
      } as AddVisitorJourney

      const formValues = {
        firstName: 'first-form-values',
      }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(paths.ADD_VISITOR.DETAILS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=firstName]').val()).toBe('first-form-values')
        })
    })

    it('should render validation errors', () => {
      const validationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'firstName',
        value: [],
        msg: 'Enter a first name',
      }

      flashData = { errors: [validationError] }

      return request(app)
        .get(paths.ADD_VISITOR.DETAILS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#firstName"]').text()).toBe('Enter a first name')
          expect($('#firstName-error').text()).toContain('Enter a first name')
        })
    })
  })

  describe(`POST ${paths.ADD_VISITOR.DETAILS}`, () => {
    const visitorDetails: AddVisitorJourney['visitorDetails'] = {
      firstName: 'first',
      lastName: 'last',
      'visitorDob-day': '1',
      'visitorDob-month': '2',
      'visitorDob-year': '2000',
      visitorDob: '2000-02-01',
    } as const

    it('should save visitor information to session and redirect to check request page', () => {
      return request(app)
        .post(paths.ADD_VISITOR.DETAILS)
        .send(visitorDetails)
        .expect(302)
        .expect('Location', paths.ADD_VISITOR.CHECK)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addVisitorJourney.visitorDetails).toStrictEqual(visitorDetails)
        })
    })

    describe('Validation errors', () => {
      let expectedFlashErrors: FieldValidationError[]

      it('should set validation errors and redirect to original page when no data entered', () => {
        expectedFlashErrors = [
          { type: 'field', location: 'body', path: 'firstName', value: '', msg: 'Enter a first name' },
          { type: 'field', location: 'body', path: 'lastName', value: '', msg: 'Enter a last name' },
          {
            type: 'field',
            location: 'body',
            path: 'visitorDob-day',
            value: '',
            msg: 'Enter a date of birth',
          },
        ]

        const expectedFlashFormValues: FlashFormValues = {
          firstName: '',
          lastName: '',
          visitorDob: 'NaN-NaN-NaN',
          'visitorDob-day': '',
          'visitorDob-month': '',
          'visitorDob-year': '',
        }

        return request(app)
          .post(paths.ADD_VISITOR.DETAILS)
          .send({})
          .expect(302)
          .expect('Location', paths.ADD_VISITOR.DETAILS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
          })
      })

      // further visitor DoB input validation tests handled by server/utils/validations.test.ts
    })
  })
})
