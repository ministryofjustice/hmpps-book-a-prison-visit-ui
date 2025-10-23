import { Router } from 'express'
import type { Services } from '../services'
import paths from '../constants/paths'
import CookiesController from './cookies/cookiesController'
import staticPagesRoutes from './staticPages'
import SelectPrisonController from './selectPrison/selectPrisonController'
import SelectedPrisonController from './selectPrison/selectedPrisonController'
import config from '../config'

export default function routes({ prisonService }: Services): Router {
  const router = Router()

  const selectPrisonController = new SelectPrisonController(prisonService)
  const selectedPrisonController = new SelectedPrisonController(prisonService)

  // Root path '/' redirect
  router.get(paths.ROOT, async (req, res) => {
    // home page for authenticated users
    if (req.user) {
      return res.redirect(paths.HOME)
    }

    return res.redirect(config.rootPathRedirect)
  })

  // Select prison
  router.get(paths.SELECT_PRISON, selectPrisonController.view())
  router.post(paths.SELECT_PRISON, selectPrisonController.validate(), selectPrisonController.submit())

  router.get(paths.SELECTED_PRISON, selectedPrisonController.view())

  // Cookies
  const cookies = new CookiesController()
  router.get(paths.COOKIES, cookies.view())
  router.post(paths.COOKIES, cookies.validate(), cookies.submit())

  // Static pages
  router.use(staticPagesRoutes())

  return router
}
