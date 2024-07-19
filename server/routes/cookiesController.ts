import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import paths from '../constants/paths'
import config from '../config'

export default class CookiesController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/cookies', {
        errors: req.flash('errors'),
        showServiceNav: !!req.session.booker,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(paths.COOKIES)
      }

      const { acceptAnalytics } = matchedData<{ acceptAnalytics: 'yes' | 'no' }>(req)

      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)

      res.cookie('cookie_policy', JSON.stringify({ acceptAnalytics }), {
        expires,
        secure: config.https,
        httpOnly: false,
        encode: String,
      })
      return res.redirect(paths.COOKIES)
    }
  }

  public validate(): ValidationChain[] {
    return [body('acceptAnalytics', 'No answer selected').isIn(['yes', 'no'])]
  }
}
