import type { RequestHandler } from 'express'
import { ValidationChain, body, matchedData, validationResult } from 'express-validator'
import paths from '../../constants/paths'

export default class AdditionalSupportController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { applicationReference, prison, visitorSupport } = req.session.bookVisitJourney!

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
        prisonName: prison!.prisonName,
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

      const bookVisitJourney = req.session.bookVisitJourney!
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
      body('additionalSupportRequired')
        .isIn(['yes', 'no'])
        .withMessage((_value, { req }) => req.t('validation:noAnswerSelected')),
      body('additionalSupport')
        .trim()
        .if(body('additionalSupportRequired').equals('yes'))
        .notEmpty()
        .withMessage((_value, { req }) => req.t('validation:supportDetailsRequired'))
        .bail()
        .isLength({ min: 3, max: 200 })
        .withMessage((_value, { req }) => req.t('validation:supportDetailsLength')),
    ]
  }
}
