import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import paths from '../../constants/paths'
import config from '../../config'
import { getMatomoCookieNames } from '../../utils/utils'
import logger from '../../../logger'

export default class CookiesController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/cookies/cookies', {
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

      logger.info(`acceptAnalytics: ${acceptAnalytics}`)
      logger.info(req.hostname)
      if (acceptAnalytics === 'no') {
        const domain = req.hostname
        logger.info(domain)

        const matomoCookieNames = getMatomoCookieNames(req.cookies)

        logger.info(matomoCookieNames)

        matomoCookieNames.forEach(cookie => {
          logger.info(`clearing ${cookie}`)
          res.clearCookie(cookie, { domain, secure: false, httpOnly: false, sameSite: 'lax' })
        })
      }

      return res.redirect(paths.COOKIES)
    }
  }

  public validate(): ValidationChain[] {
    return [body('acceptAnalytics', 'No answer selected').isIn(['yes', 'no'])]
  }
}
