import type { RequestHandler } from 'express'
import paths from '../../constants/paths'

export default class CannotBookController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisoner } = req.session.bookingJourney
      delete req.session.bookingJourney

      if (prisoner.availableVos >= 1) {
        return res.redirect(paths.HOME)
      }

      return res.render('pages/bookVisit/cannotBook', { prisoner })
    }
  }
}
