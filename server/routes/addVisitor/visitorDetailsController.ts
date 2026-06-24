import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import paths from '../../constants/paths'
import { dateOfBirthValidationChain } from '../../utils/validations'

export default class VisitorDetailsController {
  public view(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourney } = req.session

      const formValues: Record<string, string> = {
        ...(addVisitorJourney?.visitorDetails && { ...addVisitorJourney.visitorDetails }),
        ...req.flash('formValues')?.[0],
      }

      // Default to updates in Welsh on initial form load if user language is Welsh
      if (req.language === 'cy' && Object.keys(formValues).length === 0) {
        formValues.languagePreference = 'cy'
      }

      return res.render('pages/addVisitor/visitorDetails', {
        showOLServiceNav: true,
        errors: req.flash('errors'),
        formValues,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect(paths.ADD_VISITOR.DETAILS)
      }

      const data = <
        {
          firstName: string
          lastName: string
          'visitorDob-day': string
          'visitorDob-month': string
          'visitorDob-year': string
          visitorDob: string
          languagePreference?: 'cy'
        }
      >matchedData(req)

      req.session.addVisitorJourney = {
        visitorDetails: {
          firstName: data.firstName,
          lastName: data.lastName,
          'visitorDob-day': data['visitorDob-day'],
          'visitorDob-month': data['visitorDob-month'],
          'visitorDob-year': data['visitorDob-year'],
          visitorDob: data.visitorDob,
          languagePreference: data.languagePreference ?? 'en',
        },
      }

      return res.redirect(paths.ADD_VISITOR.CHECK)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('firstName')
        .trim()
        .isLength({ min: 1, max: 250 })
        .withMessage((_value, { req }) => req.t('validation:firstName')),

      body('lastName')
        .trim()
        .isLength({ min: 1, max: 250 })
        .withMessage((_value, { req }) => req.t('validation:lastName')),

      ...dateOfBirthValidationChain('visitorDob'),

      body('languagePreference').optional().isIn(['cy']),
    ]
  }
}
