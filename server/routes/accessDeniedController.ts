import { RequestHandler } from 'express'
import paths from '../constants/paths'

export default class AccessDeniedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      if (req.session.booker) {
        return res.redirect(paths.HOME)
      }

      return res.render('accessDenied')
    }
  }
}
