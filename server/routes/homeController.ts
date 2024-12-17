import type { RequestHandler } from 'express'
import paths from '../constants/paths'
import { clearSession } from '../utils/utils'

export default class HomeController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const prisoner = req.session.booker.prisoners[0]
      res.render('pages/home', { prisoner, showOLServiceNav: true })
    }
  }

  public returnHome(): RequestHandler {
    return async (req, res) => {
      clearSession(req)
      res.redirect(paths.HOME)
    }
  }
}
