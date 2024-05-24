import type { RequestHandler } from 'express'
import { NotFound } from 'http-errors'

export default class SelectPrisonerController {
  public constructor() {}

  public selectPrisoner(): RequestHandler {
    return async (req, res) => {
      // clear booking journey in session
      delete req.session.bookingJourney

      // FIXME move some of this to a session checking middleware
      if (!req.session.booker.prisoners || req.session.booker.prisoners.length === 0) {
        throw new Error('No prisoner')
      }

      const prisoner = req.session.booker.prisoners[0]

      const { displayId } = req.body
      if (displayId !== prisoner.displayId.toString()) {
        console.log(typeof displayId)
        console.log(typeof prisoner.displayId)
        throw new NotFound('Prisoner not found')
      }

      req.session.bookingJourney = { prisoner }

      res.redirect('/book-a-visit/select-visitors')
    }
  }
}
