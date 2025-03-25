import { RequestHandler, Router } from 'express'

import { ValidationChain } from 'express-validator'
import paths from '../constants/paths'
import CookiesController from './cookiesController'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { Services } from '../services'

export default function routes({ prisonService }: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  // Service start page
  get(paths.START, async (req, res) => {
    if (req.user) {
      return res.redirect(paths.HOME)
    }

    const supportedPrisons = await prisonService.getSupportedPrisons()
    return res.render('pages/serviceStart', { supportedPrisons, hideGOVUKServiceNav: true })
  })

  // Accessibility statement
  get(paths.ACCESSIBILITY, (req, res) => {
    res.render('pages/accessibilityStatement', { showOLServiceNav: !!req.session.booker })
  })

  // Cookies
  const cookies = new CookiesController()
  get(paths.COOKIES, cookies.view())
  postWithValidation(paths.COOKIES, cookies.validate(), cookies.submit())

  // Privacy notice
  get(paths.PRIVACY, (req, res) => {
    res.render('pages/privacyNotice', { showOLServiceNav: !!req.session.booker })
  })

  // Terms and conditions
  get(paths.TERMS, (req, res) => {
    res.render('pages/termsAndConditions', { showOLServiceNav: !!req.session.booker })
  })

  // Signed out
  get(paths.SIGNED_OUT, (req, res) => {
    res.render('pages/signedOut')
  })

  return router
}
