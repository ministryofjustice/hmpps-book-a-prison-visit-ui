import { RequestHandler } from 'express'

export default function analyticsConsent(): RequestHandler {
  return (req, res, next) => {
    try {
      const cookiePolicy = JSON.parse(decodeURIComponent(req.cookies.cookie_policy))
      const acceptAnalytics = ['yes', 'no'].includes(cookiePolicy?.acceptAnalytics)
        ? cookiePolicy.acceptAnalytics === 'yes'
        : undefined

      res.locals.analyticsConsentGiven = acceptAnalytics
    } catch {
      res.locals.analyticsConsentGiven = undefined
    }

    return next()
  }
}
