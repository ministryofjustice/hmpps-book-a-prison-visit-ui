import { Router } from 'express'
import paths from '../constants/paths'
import CookiesController from './cookiesController'
import { Services } from '../services'
import config from '../config'

export default function routes({ prisonService }: Services): Router {
  const router = Router()

  // Legacy service (PVB) redirect
  router.get(paths.SELECT_PRISON, (req, res) => {
    return res.redirect(config.pvbUrl)
  })

  // Service start page
  router.get(paths.START, async (req, res) => {
    if (req.user) {
      return res.redirect(paths.HOME)
    }

    const supportedPrisons = await prisonService.getSupportedPrisons()
    return res.render('pages/serviceStart', { supportedPrisons, hideGOVUKServiceNav: true })
  })

  // Accessibility statement
  router.get(paths.ACCESSIBILITY, (req, res) => {
    res.render('pages/accessibilityStatement', { showOLServiceNav: !!req.session.booker })
  })

  // Cookies
  const cookies = new CookiesController()
  router.get(paths.COOKIES, cookies.view())
  router.post(paths.COOKIES, cookies.validate(), cookies.submit())

  // Privacy notice
  router.get(paths.PRIVACY, (req, res) => {
    res.render('pages/privacyNotice', { showOLServiceNav: !!req.session.booker })
  })

  // Terms and conditions
  router.get(paths.TERMS, (req, res) => {
    res.render('pages/termsAndConditions', { showOLServiceNav: !!req.session.booker })
  })

  // Signed out
  router.get(paths.SIGNED_OUT, (req, res) => {
    res.render('pages/signedOut')
  })

  return router
}
