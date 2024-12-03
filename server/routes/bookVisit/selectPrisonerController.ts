import type { RequestHandler } from 'express'
import { NotFound } from 'http-errors'
import paths from '../../constants/paths'
import { clearSession } from '../../utils/utils'

export default class SelectPrisonerController {
  public constructor() {}

  public selectPrisoner(): RequestHandler {
    return async (req, res) => {
      clearSession(req)

      const prisoner = req.session.booker.prisoners[0]

      const { prisonerDisplayId } = req.body
      if (prisonerDisplayId !== prisoner.prisonerDisplayId) {
        throw new NotFound('Prisoner not found')
      }

      req.session.bookingJourney = { prisoner }

      if (prisoner.availableVos <= 0) {
        req.session.bookingJourney.cannotBookReason = 'NO_VO_BALANCE'
        return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
      }

      return res.redirect(paths.BOOK_VISIT.SELECT_VISITORS)
    }
  }
}
