import type { RequestHandler } from 'express'
import { ValidationChain, body, validationResult } from 'express-validator'

export default class AdditionalSupportController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      res.render('pages/bookingJourney/selectAdditionalSupport', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0] || {},
        booker: req.session.booker,
        bookingJourney: req.session.bookingJourney,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', req.body)
        return res.redirect(`/book-visit/additional-support`)
      }

      const { bookingJourney } = req.session
      bookingJourney.visitorSupport = req.body.additionalSupportRequired === 'no' ? '' : req.body.additionalSupport

      return res.redirect('/book-visit/main-contact')
    }
  }

  validate(): ValidationChain[] {
    return [
      body('additionalSupportRequired').isIn(['yes', 'no']).withMessage('No answer selected'),
      body('additionalSupport')
        .trim()
        .if(body('additionalSupportRequired').equals('yes'))
        .notEmpty()
        .withMessage('Enter details of the request')
        .bail()
        .isLength({ min: 3, max: 512 })
        .withMessage('Please enter at least 3 and no more than 512 characters'),
    ]
  }
}
