import { Request } from 'express'
import { validationResult } from 'express-validator'
import { addDays } from 'date-fns'
import { dateOfBirthValidationChain } from './validations'

const runValidation = async (body: Record<string, unknown>) => {
  const req = { body } as Request

  const validationChains = dateOfBirthValidationChain('dob')

  for (const validationChain of validationChains) {
    // eslint-disable-next-line no-await-in-loop
    await validationChain.run(req)
  }

  const errors = validationResult(req)
  return { errors, body: req.body }
}

describe('dateOfBirthValidationChain', () => {
  it('should pass for a valid date and sanitise to YYYY-MM-DD', async () => {
    const result = await runValidation({
      'dob-day': '2',
      'dob-month': '4',
      'dob-year': '1975',
    })

    expect(result.errors.isEmpty()).toBe(true)
    expect(result.body.dob).toBe('1975-04-02')
  })

  it('should handle leading zeros and extra whitespace', async () => {
    const result = await runValidation({
      'dob-day': '  02  ',
      'dob-month': '04',
      'dob-year': '1975',
    })

    expect(result.errors.isEmpty()).toBe(true)
    expect(result.body.dob).toBe('1975-04-02')
  })

  it('should fail if no input', async () => {
    const result = await runValidation({})

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('Enter a date of birth')
  })

  it('should fail if partial input', async () => {
    const result = await runValidation({
      'dob-day': '2',
      'dob-month': '4',
      // year missing
    })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('Enter a date of birth and include a day, month and year')
  })

  it('should fail if date is in the future', async () => {
    const tomorrow = addDays(new Date(), 1)
    const day = tomorrow.getDate().toString()
    const month = (tomorrow.getMonth() + 1).toString()
    const year = tomorrow.getFullYear().toString()
    const result = await runValidation({
      'dob-day': day,
      'dob-month': month,
      'dob-year': year,
    })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('Date of birth must be in the past')
  })

  it('should fail on invalid real date (e.g. 30 Feb)', async () => {
    const result = await runValidation({
      'dob-day': '30',
      'dob-month': '02',
      'dob-year': '2025',
    })

    expect(result.errors.isEmpty()).toBe(false)
    expect(result.errors.array()[0].msg).toBe('Date of birth must be a real date')
  })
})
