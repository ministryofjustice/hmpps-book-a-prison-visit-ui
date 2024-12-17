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
        showOLServiceNav: !!req.session.booker,
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

      const cookieValue = encodeURIComponent(JSON.stringify({ acceptAnalytics }))
      res.cookie('cookie_policy', cookieValue, {
        expires,
        secure: config.https,
        httpOnly: false,
        encode: String,
      })

      if (acceptAnalytics === 'no') {
        const domain = config.domain.includes('localhost') ? 'localhost' : 'justice.gov.uk'

        res.clearCookie('_ga', { domain, secure: false, httpOnly: false })
        res.clearCookie(`_ga_${config.analytics.googleAnalyticsId.replace('G-', '')}`, {
          domain,
          secure: false,
          httpOnly: false,
        })
      }

      return res.redirect(paths.COOKIES)
    }
  }

  public validate(): ValidationChain[] {
    return [body('acceptAnalytics', 'No answer selected').isIn(['yes', 'no'])]
  }
}
