import { Router } from 'express'

import paths from '../constants/paths'

export default function routes(): Router {
  const router = Router()

  // Accessibility statement
  router.get(paths.ACCESSIBILITY, (req, res) => {
    res.render('pages/accessibilityStatement')
  })

  return router
}
