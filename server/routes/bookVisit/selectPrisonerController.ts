import type { RequestHandler } from 'express'
import { NotFound } from 'http-errors'
import paths from '../../constants/paths'

export default class SelectPrisonerController {
  public constructor() {}

  public selectPrisoner(): RequestHandler {
    return async (req, res) => {
      // clear booking journey in session
      delete req.session.bookingJourney
      delete req.session.bookingConfirmed

      // FIXME move some of this to a session checking middleware
      if (!req.session.booker.prisoners || req.session.booker.prisoners.length === 0) {
        throw new Error('No prisoner')
      }

      const prisoner = req.session.booker.prisoners[0]

      const { prisonerDisplayId } = req.body
      if (prisonerDisplayId.toString() !== prisoner.prisonerDisplayId.toString()) {
        throw new NotFound('Prisoner not found')
      }

      req.session.bookingJourney = { prisoner }

      res.redirect(paths.BOOK_VISIT.SELECT_VISITORS)
    }
  }
}
