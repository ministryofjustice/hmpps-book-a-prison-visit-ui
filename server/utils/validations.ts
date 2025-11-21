import { isAfter, isValid, parseISO } from 'date-fns'
import { body, ValidationChain } from 'express-validator'

// eslint-disable-next-line import/prefer-default-export
export const dateOfBirthValidationChain = (dobFieldBaseName: string): ValidationChain[] => {
  return [
    // Tidy day, month, year fields
    body([`${dobFieldBaseName}-day`, `${dobFieldBaseName}-month`, `${dobFieldBaseName}-year`]).trim(),

    // 'dobFieldBaseName' is not an actual form field but used to store combined result
    body(dobFieldBaseName).customSanitizer((_value, { req }) => {
      const day = Number.parseInt(req.body?.[`${dobFieldBaseName}-day`], 10).toString().padStart(2, '0')
      const month = Number.parseInt(req.body?.[`${dobFieldBaseName}-month`], 10).toString().padStart(2, '0')
      const year = Number.parseInt(req.body?.[`${dobFieldBaseName}-year`], 10).toString()
      return `${year}-${month}-${day}`
    }),

    // set any validation errors against the 'day' field so ErrorSummary links to this
    body(`${dobFieldBaseName}-day`).custom((_value, { req }) => {
      const date = req.body[dobFieldBaseName] ?? ''
      if (date === 'NaN-NaN-NaN') {
        throw new Error('Enter a date of birth')
      }

      if (date.includes('NaN')) {
        throw new Error('Enter a date of birth and include a day, month and year')
      }

      const parsedDate = parseISO(date)
      if (!isValid(parsedDate)) {
        throw new Error('Date of birth must be a real date')
      }

      if (isAfter(parsedDate, new Date())) {
        throw new Error('Date of birth must be in the past')
      }

      return true
    }),
  ]
}
