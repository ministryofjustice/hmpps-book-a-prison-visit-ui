import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import paths from '../../constants/paths'
import { BookerService } from '../../services'
import { dateOfBirthValidationChain } from '../../utils/validations'

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
          'prisonerDob-day': string
          'prisonerDob-month': string
          'prisonerDob-year': string
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
          'prisonerDob-day': data['prisonerDob-day'],
          'prisonerDob-month': data['prisonerDob-month'],
          'prisonerDob-year': data['prisonerDob-year'],
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

      ...dateOfBirthValidationChain('prisonerDob'),

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
