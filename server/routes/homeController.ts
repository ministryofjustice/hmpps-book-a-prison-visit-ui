import type { RequestHandler } from 'express'
import paths from '../constants/paths'
import { clearSession } from '../utils/utils'
import config from '../config'

export default class HomeController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const prisoner = req.session.booker.prisoners[0]

      if (!prisoner && config.features.addPrisoner) {
        return res.redirect(paths.ADD_PRISONER.LOCATION)
      }

      return res.render('pages/home', { prisoner, showOLServiceNav: true })
    }
  }

  public returnHome(): RequestHandler {
    return async (req, res) => {
      clearSession(req)
      res.redirect(paths.HOME)
    }
  }
}
