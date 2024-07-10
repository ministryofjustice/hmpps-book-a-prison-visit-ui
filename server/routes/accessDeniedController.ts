import { RequestHandler } from 'express'
import paths from '../constants/paths'

export default class AccessDeniedController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      return req.session.booker ? res.redirect(paths.HOME) : res.render('accessDenied')
    }
  }
}
