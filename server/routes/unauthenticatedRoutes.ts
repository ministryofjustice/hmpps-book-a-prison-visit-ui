import { Router } from 'express'

import paths from '../constants/paths'

export default function routes(): Router {
  const router = Router()

  // Accessibility statement
  router.get(paths.ACCESSIBILITY, (req, res) => {
    res.render('pages/accessibilityStatement')
  })

  // Privacy policy
  router.get(paths.PRIVACY, (req, res) => {
    res.render('pages/privacyPolicy')
  })

  // Terms and conditions
  router.get(paths.TERMS, (req, res) => {
    res.render('pages/termsAndConditions')
  })

  return router
}
