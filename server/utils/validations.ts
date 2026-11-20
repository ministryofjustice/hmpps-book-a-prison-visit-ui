import { isAfter, isValid, parseISO } from 'date-fns'
import { body, ValidationChain } from 'express-validator'

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
      const request = req as Express.Request
      const date = req.body[dobFieldBaseName] ?? ''
      if (date === 'NaN-NaN-NaN') {
        throw new Error(request.t('validation:dateOfBirth'))
      }

      if (date.includes('NaN')) {
        throw new Error(request.t('validation:dateOfBirthIncomplete'))
      }

      const parsedDate = parseISO(date)
      if (!isValid(parsedDate)) {
        throw new Error(request.t('validation:dateOfBirthInvalid'))
      }

      if (isAfter(parsedDate, new Date())) {
        throw new Error(request.t('validation:dateOfBirthPast'))
      }

      return true
    }),
  ]
}

// Validate that prisonId is in the set of prisons present in req.context.prisonNames
export const prisonIdValidation = (errorMsgKey: string): ValidationChain => {
  return body('prisonId', (_value, { req }) => req.t(errorMsgKey))
    .isLength({ min: 3, max: 3 })
    .bail()
    .custom((prisonId: string, { req }) => {
      const validPrisonNames = (req as Express.Request).context?.prisonNames // these are keyed by prisonId
      return validPrisonNames && prisonId in validPrisonNames
    })
}
