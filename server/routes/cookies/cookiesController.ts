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
      const matomoCookieNames = getMatomoCookieNames(req.cookies)
      const cookieDescriptions: (
        | { text: string; attributes: { 'data-test': string } }
        | { text: string; attributes?: undefined }
      )[][] = []

      logger.info(JSON.stringify(matomoCookieNames))

      matomoCookieNames.forEach(cookieName => {
        if (cookieName.startsWith('_pk_id')) {
          cookieDescriptions.push([
            {
              text: cookieName,
              attributes: { 'data-test': 'matomo-id-cookie-name' },
            },
            { text: 'Stores a unique visitor ID.' },
            { text: '13 months' },
          ])
        } else if (cookieName.startsWith('_pk_ses')) {
          cookieDescriptions.push([
            {
              text: cookieName,
              attributes: { 'data-test': 'matomo-session-cookie-name' },
            },
            { text: 'Session cookie temporarily stores data for the visit.' },
            { text: '30 minutes' },
          ])
        }
      })

      return res.render('pages/cookies/cookies', {
        errors: req.flash('errors'),
        showOLServiceNav: !!req.session.booker,
        cookieDescriptions,
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

        logger.info(req.cookies)
        getMatomoCookieNames(req.cookies).forEach(cookie => {
          res.clearCookie(cookie, { domain, secure: false, httpOnly: false })
        })
      }

      return res.redirect(paths.COOKIES)
    }
  }

  public validate(): ValidationChain[] {
    return [body('acceptAnalytics', 'No answer selected').isIn(['yes', 'no'])]
  }
}
