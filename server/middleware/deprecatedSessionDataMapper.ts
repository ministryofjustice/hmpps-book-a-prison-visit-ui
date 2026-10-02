import type { RequestHandler } from 'express'

// Map deprecated prison property to prisonId in session if present
export default function deprecatedSessionDataMapper(): RequestHandler {
  return (req, _res, next) => {
    if (req.session?.bookVisitJourney?.prison) {
      req.session.bookVisitJourney.prisonId = req.session.bookVisitJourney.prison.code
    }

    if (req.session?.bookVisitConfirmed?.prison) {
      req.session.bookVisitConfirmed.prisonId = req.session.bookVisitConfirmed.prison.code
    }

    next()
  }
}
