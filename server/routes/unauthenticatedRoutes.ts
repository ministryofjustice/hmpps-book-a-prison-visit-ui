import { Router } from 'express'
import type { Services } from '../services'
import paths from '../constants/paths'
import config from '../config'
import CookiesController from './cookies/cookiesController'
import staticPagesRoutes from './staticPages'

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

  // Cookies
  const cookies = new CookiesController()
  router.get(paths.COOKIES, cookies.view())
  router.post(paths.COOKIES, cookies.validate(), cookies.submit())

  // Static pages
  router.use(staticPagesRoutes())

  return router
}
