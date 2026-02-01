import type { RequestHandler } from 'express'
import { ValidationChain, body, matchedData, validationResult } from 'express-validator'
import paths from '../../constants/paths'

export default class AdditionalSupportController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { applicationReference, visitorSupport } = req.session.bookVisitJourney

      const selectedAdditionalSupport =
        visitorSupport !== undefined
          ? {
              additionalSupportRequired: visitorSupport === '' ? 'no' : 'yes',
              additionalSupport: visitorSupport,
            }
          : {}

      const formValues = {
        ...selectedAdditionalSupport,
        ...req.flash('formValues')?.[0],
      }

      res.render('pages/bookVisit/additionalSupport', {
        errors: req.flash('errors'),
        formValues,
        prisonName: req.session.bookVisitJourney.prison.prisonName,
        applicationReference,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect(paths.BOOK_VISIT.ADDITIONAL_SUPPORT)
      }

      const { bookVisitJourney } = req.session
      const { additionalSupport, additionalSupportRequired } = matchedData<{
        additionalSupport?: string
        additionalSupportRequired?: 'yes' | 'no'
      }>(req)

      bookVisitJourney.visitorSupport = additionalSupportRequired === 'no' ? '' : additionalSupport

      return res.redirect(paths.BOOK_VISIT.MAIN_CONTACT)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('additionalSupportRequired').isIn(['yes', 'no']).withMessage('No answer selected'),
      body('additionalSupport')
        .trim()
        .if(body('additionalSupportRequired').equals('yes'))
        .notEmpty()
        .withMessage('Enter details of the request')
        .bail()
        .isLength({ min: 3, max: 200 })
        .withMessage('Please enter at least 3 and no more than 200 characters'),
    ]
  }
}
