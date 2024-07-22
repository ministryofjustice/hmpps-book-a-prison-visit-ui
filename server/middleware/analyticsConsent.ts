import { RequestHandler } from 'express'

export default function analyticsConsent(): RequestHandler {
  return (req, res, next) => {
    try {
      const cookiePolicy = JSON.parse(req.cookies.cookie_policy)
      const acceptAnalytics = ['yes', 'no'].includes(cookiePolicy?.acceptAnalytics)
        ? cookiePolicy.acceptAnalytics === 'yes'
        : undefined

      res.locals.analyticsEnabled = acceptAnalytics
    } catch (error) {
      res.locals.analyticsEnabled = undefined
    }

    return next()
  }
}
