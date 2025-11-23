import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import paths from '../../constants/paths'
import { dateOfBirthValidationChain } from '../../utils/validations'

export default class VisitorDetailsController {
  public view(): RequestHandler {
    return async (req, res) => {
      const { addVisitorJourney } = req.session

      const formValues = {
        ...(addVisitorJourney?.visitorDetails && { ...addVisitorJourney.visitorDetails }),
        ...req.flash('formValues')?.[0],
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
        },
      }

      return res.redirect(paths.ADD_VISITOR.CHECK)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('firstName', 'Enter a first name').trim().isLength({ min: 1, max: 250 }),
      body('lastName', 'Enter a last name').trim().isLength({ min: 1, max: 250 }),

      ...dateOfBirthValidationChain('visitorDob'),
    ]
  }
}
