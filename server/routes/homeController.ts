import type { RequestHandler } from 'express'
import paths from '../constants/paths'
import { clearSession } from '../utils/utils'

export default class HomeController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session
      res.render('pages/home', { prisoners: booker.prisoners, showServiceNav: true })
    }
  }

  public returnHome(): RequestHandler {
    return async (req, res) => {
      clearSession(req)
      res.redirect(paths.HOME)
    }
  }
}
