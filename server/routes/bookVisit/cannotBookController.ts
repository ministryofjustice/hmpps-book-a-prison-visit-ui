import type { RequestHandler } from 'express'
import { clearSession } from '../../utils/utils'

export default class CannotBookController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisoner, cannotBookReason } = req.session.bookVisitJourney
      clearSession(req)

      return res.render('pages/bookVisit/cannotBook', { prisoner, cannotBookReason })
    }
  }
}
