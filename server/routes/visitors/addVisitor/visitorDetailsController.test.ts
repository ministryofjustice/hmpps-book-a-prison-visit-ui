import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { randomUUID } from 'crypto'
import { FlashData, appWithAllRoutes, flashProvider } from '../../testutils/appSetup'
import paths from '../../../constants/paths'
import { AddVisitorJourney, FlashFormValues } from '../../../@types/bapv'
import TestData from '../../testutils/testData'
import { disableFeatureForTest, enableFeatureForTest } from '../../../data/testutils/mockFeatureFlags'

let app: Express

let sessionData: SessionData
const prisoner1 = TestData.prisoner({ prisonerDisplayId: randomUUID() })
const prisoner2 = TestData.prisoner({
  prisonerDisplayId: randomUUID(),
  prisonerNumber: 'B2134AB',
  firstName: 'Jane',
  dateOfBirth: '1990-05-20',
})

beforeEach(() => {
  enableFeatureForTest('multiplePrisoners')
  sessionData = { booker: { prisoners: [prisoner1, prisoner2] } } as SessionData

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

    it('should render visitor information page (in English - without Welsh updates preference checkbox)', () => {
      return request(app)
        .get(`${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Visitor information -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(
            `${paths.ADD_VISITOR.START}/${prisoner1.prisonerDisplayId}`,
          )
          expect($('h1').text().trim()).toBe('Link a new visitor for John Smith')
          expect($('h2').text().trim()).toContain('Visitor information')

          expect($('form[method=POST]').attr('action')).toBe(
            `${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`,
          )
          expect($('input[name=firstName]').length).toBe(1)
          expect($('input[name=lastName]').length).toBe(1)
          expect($('input[name=visitorDob-day]').length).toBe(1)
          expect($('input[name=visitorDob-month]').length).toBe(1)
          expect($('input[name=visitorDob-year]').length).toBe(1)
          expect($('input[name=languagePreference]').length).toBe(0)
          expect($('[data-test="continue-button"]').text().trim()).toBe('Continue')
        })
    })

    it('should display the prisoner associated with the display id in the URL', () => {
      return request(app)
        .get(`${paths.ADD_VISITOR.DETAILS}/${prisoner2.prisonerDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Link a new visitor for Jane Smith')
          expect($('[data-test="back-link"]').attr('href')).toBe(
            `${paths.ADD_VISITOR.START}/${prisoner2.prisonerDisplayId}`,
          )
          expect($('form[method=POST]').attr('action')).toBe(
            `${paths.ADD_VISITOR.DETAILS}/${prisoner2.prisonerDisplayId}`,
          )
        })
    })

    it('should fallback to the first prisoner when FEATURES_MULTIPLE_PRISONERS is disabled', () => {
      disableFeatureForTest('multiplePrisoners')
      app = appWithAllRoutes({ sessionData })
      return request(app)
        .get(paths.ADD_VISITOR.DETAILS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Link a new visitor for John Smith')
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.ADD_VISITOR.START)
          expect($('form[method=POST]').attr('action')).toBe(paths.ADD_VISITOR.DETAILS)
        })
    })

    it('should render visitor information page (in Welsh - with Welsh updates preference checkbox)', () => {
      app = appWithAllRoutes({ sessionData, lng: 'cy' })

      return request(app)
        .get(`${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=languagePreference]').length).toBe(1)
          expect($('input[name=languagePreference]').prop('checked')).toBe(true)
        })
    })

    it('should pre-populate with data in session if prisoner matches', () => {
      sessionData.addVisitorJourney = {
        prisoner: prisoner1,
        visitorDetails: {
          firstName: 'first',
          lastName: 'last',
          'visitorDob-day': '1',
          'visitorDob-month': '2',
          'visitorDob-year': '2000',
          visitorDob: '2000-02-01',
          languagePreference: 'en',
        },
      }

      return request(app)
        .get(`${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
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

    it('should not pre-populate with data in session if prisoner does not match', () => {
      sessionData.addVisitorJourney = {
        prisoner: prisoner1,
        visitorDetails: {
          firstName: 'first',
          lastName: 'last',
          'visitorDob-day': '1',
          'visitorDob-month': '2',
          'visitorDob-year': '2000',
          visitorDob: '2000-02-01',
          languagePreference: 'en',
        },
      }

      return request(app)
        .get(`${paths.ADD_VISITOR.DETAILS}/${prisoner2.prisonerDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          ;['firstName', 'lastName', 'visitorDob-day', 'visitorDob-month', 'visitorDob-year'].forEach(name => {
            const input = $(`input[name=${name}]`)
            expect(input.length).toBe(1)
            expect(input.val() ?? '').toBe('')
          })
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.addVisitorJourney = {
        visitorDetails: {
          firstName: 'first-session',
        },
        prisoner: prisoner1,
      } as AddVisitorJourney

      const formValues = {
        firstName: 'first-form-values',
      }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(`${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
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
        .get(`${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#firstName"]').text()).toBe('Enter a first name')
          expect($('#firstName-error').text()).toContain('Enter a first name')
        })
    })
  })

  describe(`POST ${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`, () => {
    const formData = {
      firstName: 'first',
      lastName: 'last',
      'visitorDob-day': '1',
      'visitorDob-month': '2',
      'visitorDob-year': '2000',
      visitorDob: '2000-02-01',
    }

    it('should save visitor information to session and redirect to check request page (English language)', () => {
      const expectedVisitorDetails: AddVisitorJourney['visitorDetails'] = {
        ...formData,
        languagePreference: 'en',
      }
      return request(app)
        .post(`${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
        .send(formData)
        .expect(302)
        .expect('Location', paths.ADD_VISITOR.CHECK)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addVisitorJourney!.visitorDetails).toStrictEqual(expectedVisitorDetails)
        })
    })

    it('should save visitor information to session and redirect to check request page (Welsh language with updates in Welsh checked)', () => {
      const expectedVisitorDetails: AddVisitorJourney['visitorDetails'] = {
        ...formData,
        languagePreference: 'cy',
      }
      app = appWithAllRoutes({ sessionData, lng: 'cy' })

      return request(app)
        .post(`${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
        .send({ ...formData, languagePreference: 'cy' })
        .expect(302)
        .expect('Location', paths.ADD_VISITOR.CHECK)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addVisitorJourney!.visitorDetails).toStrictEqual(expectedVisitorDetails)
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
          prisonerDisplayId: prisoner1.prisonerDisplayId,
        }

        return request(app)
          .post(`${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
          .send({})
          .expect(302)
          .expect('Location', `${paths.ADD_VISITOR.DETAILS}/${prisoner1.prisonerDisplayId}`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
          })
      })

      // further visitor DoB input validation tests handled by server/utils/validations.test.ts
    })
  })
})
