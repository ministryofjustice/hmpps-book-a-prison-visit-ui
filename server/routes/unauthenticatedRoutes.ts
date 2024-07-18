import { Router } from 'express'

import paths from '../constants/paths'

export default function routes(): Router {
  const router = Router()

  // Accessibility statement
  router.get(paths.ACCESSIBILITY, (req, res) => {
    res.render('pages/accessibilityStatement', { showServiceNav: !!req.session.booker })
  })

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
    res.render('pages/signedOut', { showServiceNav: !!req.session.booker })
  })

  return router
}
