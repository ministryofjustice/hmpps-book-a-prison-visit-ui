import { Request } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { addDays } from 'date-fns'
import { dateOfBirthValidationChain, prisonIdValidation } from './validations'
import { mockTFunction } from '../data/testutils/mockI18n'
import TestData from '../routes/testutils/testData'

const prisonNames = TestData.prisonNames()

const runValidation = async ({
  body,
  validationChain,
}: {
  body: Record<string, unknown>
  validationChain: ValidationChain[]
}) => {
  const req = {
    body,
    context: { prisonNames },
  } as Request
  req.t = mockTFunction

  for (const validation of validationChain) {
    // eslint-disable-next-line no-await-in-loop
    await validation.run(req)
  }

  const errors = validationResult(req)
  return { errors, body: req.body }
}

describe('dateOfBirthValidationChain', () => {
  it('should pass for a valid date and sanitise to YYYY-MM-DD', async () => {
    const result = await runValidation({
      body: {
        'dob-day': '2',
        'dob-month': '4',
        'dob-year': '1975',
      },
      validationChain: dateOfBirthValidationChain('dob'),
    })

    expect(result.errors.isEmpty()).toBe(true)
    expect(result.body.dob).toBe('1975-04-02')
  })

  it('should handle leading zeros and extra whitespace', async () => {
    const result = await runValidation({
      body: {
        'dob-day': '  02  ',
        'dob-month': '04',
        'dob-year': '1975',
      },
      validationChain: dateOfBirthValidationChain('dob'),
    })

    expect(result.errors.isEmpty()).toBe(true)
    expect(result.body.dob).toBe('1975-04-02')
  })

  it('should fail if no input', async () => {
    const result = await runValidation({ body: {}, validationChain: dateOfBirthValidationChain('dob') })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('validation:dateOfBirth')
  })

  it('should fail if partial input', async () => {
    const result = await runValidation({
      body: {
        'dob-day': '2',
        'dob-month': '4',
        // year missing
      },
      validationChain: dateOfBirthValidationChain('dob'),
    })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('validation:dateOfBirthIncomplete')
  })

  it('should fail if date is in the future', async () => {
    const tomorrow = addDays(new Date(), 1)
    const day = tomorrow.getDate().toString()
    const month = (tomorrow.getMonth() + 1).toString()
    const year = tomorrow.getFullYear().toString()
    const result = await runValidation({
      body: {
        'dob-day': day,
        'dob-month': month,
        'dob-year': year,
      },
      validationChain: dateOfBirthValidationChain('dob'),
    })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('validation:dateOfBirthPast')
  })

  it('should fail on invalid real date (e.g. 30 Feb)', async () => {
    const result = await runValidation({
      body: {
        'dob-day': '30',
        'dob-month': '02',
        'dob-year': '2025',
      },
      validationChain: dateOfBirthValidationChain('dob'),
    })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('validation:dateOfBirthInvalid')
  })
})

describe('prisonIdValidation', () => {
  it('should pass for a valid prison ID', async () => {
    const result = await runValidation({
      body: {
        prisonId: 'HEI',
      },
      validationChain: [prisonIdValidation('validation:testKey')],
    })

    expect(result.errors.isEmpty()).toBe(true)
  })

  it('should fail for an invalid prison ID', async () => {
    const result = await runValidation({
      body: {
        prisonId: 'XYZ',
      },
      validationChain: [prisonIdValidation('validation:testKey')],
    })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('validation:testKey')
  })

  it('should fail for an invalid format prison ID', async () => {
    const result = await runValidation({
      body: {
        prisonId: 'THIS IS TOO LONG',
      },
      validationChain: [prisonIdValidation('validation:testKey')],
    })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('validation:testKey')
  })
})
