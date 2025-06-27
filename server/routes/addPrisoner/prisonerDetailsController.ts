import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { isAfter, isValid, parseISO } from 'date-fns'
import paths from '../../constants/paths'
import { BookerService } from '../../services'

export default class PrisonerDetailsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { addPrisonerJourney } = req.session
      if (!addPrisonerJourney?.selectedPrison) {
        return res.redirect(paths.ADD_PRISONER.LOCATION)
      }

      const formValues = {
        ...(addPrisonerJourney?.prisonerDetails && { ...addPrisonerJourney.prisonerDetails }),
        ...req.flash('formValues')?.[0],
      }

      return res.render('pages/addPrisoner/prisonerDetails', { errors: req.flash('errors'), formValues })
    }
  }

  public submit(): RequestHandler {
    return async (req, res, next) => {
      const { addPrisonerJourney } = req.session
      if (!addPrisonerJourney?.selectedPrison) {
        return res.redirect(paths.ADD_PRISONER.LOCATION)
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect(paths.ADD_PRISONER.DETAILS)
      }

      const data = <
        {
          firstName: string
          lastName: string
          day: string
          month: string
          year: string
          prisonerDob: string
          prisonNumber: string
        }
      >matchedData(req)

      try {
        const { reference } = req.session.booker
        const result = await this.bookerService.registerPrisoner(reference, {
          prisonerId: data.prisonNumber,
          prisonerFirstName: data.firstName,
          prisonerLastName: data.lastName,
          prisonerDateOfBirth: data.prisonerDob,
          prisonId: addPrisonerJourney.selectedPrison.prisonId,
        })

        addPrisonerJourney.result = result

        if (result) {
          return res.redirect(paths.ADD_PRISONER.SUCCESS)
        }

        // if registering fails, store form field data so user can return and amend
        addPrisonerJourney.prisonerDetails = {
          firstName: data.firstName,
          lastName: data.lastName,
          day: data.day,
          month: data.month,
          year: data.year,
          prisonNumber: data.prisonNumber,
        }

        return res.redirect(paths.ADD_PRISONER.FAIL)
      } catch (error) {
        return next(error)
      }
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('firstName', 'Enter a first name').trim().isLength({ min: 1, max: 250 }),
      body('lastName', 'Enter a last name').trim().isLength({ min: 1, max: 250 }),

      body(['day', 'month', 'year']).trim(),
      // 'prisonerDob' not an actual form field but used to store combined result and any validation errors
      body('prisonerDob')
        .customSanitizer((_value, { req }) => {
          const day = Number.parseInt(req.body?.day, 10).toString().padStart(2, '0')
          const month = Number.parseInt(req.body?.month, 10).toString().padStart(2, '0')
          const year = Number.parseInt(req.body?.year, 10).toString()
          return `${year}-${month}-${day}`
        })
        .custom((date: string) => {
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

      body('prisonNumber')
        .trim()
        .notEmpty()
        .withMessage('Enter a prison number')
        .bail()
        .isLength({ min: 7, max: 7 })
        .withMessage('Enter a prison number with 7 characters')
        .bail()
        .toUpperCase()
        .matches(/^[A-Z][0-9]{4}[A-Z]{2}$/)
        .withMessage('Enter a prison number with only letters and numbers'),
    ]
  }
}
