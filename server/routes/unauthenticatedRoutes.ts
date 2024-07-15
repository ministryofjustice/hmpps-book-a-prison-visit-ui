import { RequestHandler, Router } from 'express'

import { ValidationChain } from 'express-validator'
import paths from '../constants/paths'
import CookiesController from './cookiesController'
import asyncMiddleware from '../middleware/asyncMiddleware'

export default function routes(): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const postWithValidation = (path: string | string[], validationChain: ValidationChain[], handler: RequestHandler) =>
    router.post(path, ...validationChain, asyncMiddleware(handler))

  // Accessibility statement
  router.get(paths.ACCESSIBILITY, (req, res) => {
    res.render('pages/accessibilityStatement', { showServiceNav: !!req.session.booker })
  })

  // Cookies
  const cookies = new CookiesController()
  get(paths.COOKIES, cookies.view())
  postWithValidation(paths.COOKIES, cookies.validate(), cookies.submit())

  // Privacy notice
  router.get(paths.PRIVACY, (req, res) => {
    res.render('pages/privacyNotice', { showServiceNav: !!req.session.booker })
  })

  // Terms and conditions
  router.get(paths.TERMS, (req, res) => {
    res.render('pages/termsAndConditions', { showServiceNav: !!req.session.booker })
  })

  // Signed out
  router.get(paths.SIGNED_OUT, (req, res) => {
    res.render('pages/signedOut')
  })

  return router
}
