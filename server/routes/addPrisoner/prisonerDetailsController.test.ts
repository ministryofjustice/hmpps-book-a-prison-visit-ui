import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { FieldValidationError } from 'express-validator'
import { BadRequest } from 'http-errors'
import { FlashData, appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import paths from '../../constants/paths'
import { createMockBookerService } from '../../services/testutils/mocks'
import { AddPrisonerJourney, FlashFormValues } from '../../@types/bapv'

let app: Express

const bookerService = createMockBookerService()
let sessionData: SessionData

const selectedPrison = TestData.prisonRegisterPrisonDto()
const supportedPrisons = [selectedPrison]

beforeEach(() => {
  sessionData = { addPrisonerJourney: { supportedPrisons, selectedPrison } } as SessionData

  app = appWithAllRoutes({ services: { bookerService }, sessionData })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner details', () => {
  describe(`GET ${paths.ADD_PRISONER.DETAILS}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = {}
      flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])
    })

    it('should redirect to prisoner location page if selectedPrison not set in session', () => {
      sessionData.addPrisonerJourney.selectedPrison = undefined
      return request(app).get(paths.ADD_PRISONER.DETAILS).expect(302).expect('Location', paths.ADD_PRISONER.LOCATION)
    })

    it('should render prisoner details page', () => {
      return request(app)
        .get(paths.ADD_PRISONER.DETAILS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('title').text()).toMatch(/^Prisoner details -/)
          expect($('#navigation').length).toBe(1)
          expect($('[data-test="back-link"]').attr('href')).toBe(paths.ADD_PRISONER.LOCATION)
          expect($('h1').text().trim()).toBe('Prisoner details')

          expect($('form[method=POST]').attr('action')).toBe(paths.ADD_PRISONER.DETAILS)
          expect($('input[name=firstName]').length).toBe(1)
          expect($('input[name=lastName]').length).toBe(1)
          expect($('input[name=prisonerDob-day]').length).toBe(1)
          expect($('input[name=prisonerDob-month]').length).toBe(1)
          expect($('input[name=prisonerDob-year]').length).toBe(1)
          expect($('input[name=prisonNumber]').length).toBe(1)
          expect($('[data-test="confirm-button"]').text().trim()).toBe('Confirm and send')
        })
    })

    it('should pre-populate with data in session', () => {
      sessionData.addPrisonerJourney.prisonerDetails = {
        firstName: 'first',
        lastName: 'last',
        'prisonerDob-day': '1',
        'prisonerDob-month': '2',
        'prisonerDob-year': '2000',
        prisonNumber: 'A1234BC',
      }

      return request(app)
        .get(paths.ADD_PRISONER.DETAILS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('input[name=firstName]').val()).toBe('first')
          expect($('input[name=lastName]').val()).toBe('last')
          expect($('input[name=prisonerDob-day]').val()).toBe('1')
          expect($('input[name=prisonerDob-month]').val()).toBe('2')
          expect($('input[name=prisonerDob-year]').val()).toBe('2000')
          expect($('input[name=prisonNumber]').val()).toBe('A1234BC')
        })
    })

    it('should pre-populate with data in formValues overriding that in session', () => {
      sessionData.addPrisonerJourney.prisonerDetails = {
        firstName: 'first-session',
      } as AddPrisonerJourney['prisonerDetails']

      const formValues = {
        firstName: 'first-form-values',
      }
      flashData = { formValues: [formValues] }

      return request(app)
        .get(paths.ADD_PRISONER.DETAILS)
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
        .get(paths.ADD_PRISONER.DETAILS)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-error-summary a[href="#firstName"]').text()).toBe('Enter a first name')
          expect($('#firstName-error').text()).toContain('Enter a first name')
        })
    })
  })

  describe(`POST ${paths.ADD_PRISONER.DETAILS}`, () => {
    const bookerReference = TestData.bookerReference().value
    const prisonerDetails: AddPrisonerJourney['prisonerDetails'] = {
      firstName: 'John',
      lastName: 'Smith',
      'prisonerDob-day': '2',
      'prisonerDob-month': '4',
      'prisonerDob-year': '1975',
      prisonNumber: 'A1234BC',
    } as const
    const registerPrisonerDto = TestData.registerPrisonerForBookerDto()

    it('should redirect to prisoner location page if selectedPrison not set in session', () => {
      sessionData.addPrisonerJourney.selectedPrison = undefined
      return request(app).post(paths.ADD_PRISONER.DETAILS).expect(302).expect('Location', paths.ADD_PRISONER.LOCATION)
    })

    it('should call service to register prisoner, store result in session and redirect to success page - success', () => {
      bookerService.registerPrisoner.mockResolvedValue(true)

      return request(app)
        .post(paths.ADD_PRISONER.DETAILS)
        .send(prisonerDetails)
        .expect(302)
        .expect('Location', paths.ADD_PRISONER.SUCCESS)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addPrisonerJourney.prisonerDetails).toBeUndefined()
          expect(sessionData.addPrisonerJourney.result).toBe(true)
          expect(bookerService.registerPrisoner).toHaveBeenCalledWith(bookerReference, registerPrisonerDto)
        })
    })

    it('should call service to register prisoner, save prisoner details in session and redirect to failure page - fail', () => {
      bookerService.registerPrisoner.mockResolvedValue(false)

      return request(app)
        .post(paths.ADD_PRISONER.DETAILS)
        .send(prisonerDetails)
        .expect(302)
        .expect('Location', paths.ADD_PRISONER.FAIL)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addPrisonerJourney.prisonerDetails).toStrictEqual(prisonerDetails)
          expect(sessionData.addPrisonerJourney.result).toBe(false)
          expect(bookerService.registerPrisoner).toHaveBeenCalledWith(bookerReference, registerPrisonerDto)
        })
    })

    it('should throw any other API error response', () => {
      bookerService.registerPrisoner.mockRejectedValue(new BadRequest())

      return request(app)
        .post(paths.ADD_PRISONER.DETAILS)
        .send(prisonerDetails)
        .expect(400)
        .expect(() => {
          expect(flashProvider).not.toHaveBeenCalled()
          expect(sessionData.addPrisonerJourney.prisonerDetails).toBeUndefined()
          expect(sessionData.addPrisonerJourney.result).toBeUndefined()
          expect(bookerService.registerPrisoner).toHaveBeenCalledWith(bookerReference, registerPrisonerDto)
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
            path: 'prisonerDob-day',
            value: '',
            msg: 'Enter a date of birth',
          },
          { type: 'field', location: 'body', path: 'prisonNumber', value: '', msg: 'Enter a prison number' },
        ]

        const expectedFlashFormValues: FlashFormValues = {
          firstName: '',
          lastName: '',
          prisonerDob: 'NaN-NaN-NaN',
          'prisonerDob-day': '',
          'prisonerDob-month': '',
          'prisonerDob-year': '',
          prisonNumber: '',
        }

        return request(app)
          .post(paths.ADD_PRISONER.DETAILS)
          .send({})
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.DETAILS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', expectedFlashFormValues)
          })
      })

      // further prisoner DoB input validation tests handled by server/utils/validations.test.ts

      it('should set validation error when prison number wrong length', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'prisonNumber',
            value: 'A1234',
            msg: 'Enter a prison number with 7 characters',
          },
        ]

        return request(app)
          .post(paths.ADD_PRISONER.DETAILS)
          .send({ ...prisonerDetails, prisonNumber: 'A1234' })
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.DETAILS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              ...prisonerDetails,
              prisonerDob: '1975-04-02',
              prisonNumber: 'A1234',
            })
          })
      })

      it('should set validation error when prison number wrong format', () => {
        expectedFlashErrors = [
          {
            type: 'field',
            location: 'body',
            path: 'prisonNumber',
            value: '1234567',
            msg: 'Enter a prison number with only letters and numbers',
          },
        ]

        return request(app)
          .post(paths.ADD_PRISONER.DETAILS)
          .send({ ...prisonerDetails, prisonNumber: '1234567' })
          .expect(302)
          .expect('Location', paths.ADD_PRISONER.DETAILS)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', expectedFlashErrors)
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              ...prisonerDetails,
              prisonerDob: '1975-04-02',
              prisonNumber: '1234567',
            })
          })
      })
    })
  })
})
