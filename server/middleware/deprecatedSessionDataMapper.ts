import type { RequestHandler } from 'express'
import { PrisonService } from '../services'

// Map deprecated prison property to prisonId in session if present
export default function deprecatedSessionDataMapper(prisonService: PrisonService): RequestHandler {
  return async (req, _res, next) => {
    // Map old session data to new (existing session handled by new pod)
    if (req.session?.bookVisitJourney?.prison) {
      req.session.bookVisitJourney.prisonId = req.session.bookVisitJourney.prison.code
    }

    if (req.session?.bookVisitConfirmed?.prison) {
      req.session.bookVisitConfirmed.prisonId = req.session.bookVisitConfirmed.prison.code
    }

    // Map new session data to old (new session data handled by old pod during deployment)
    if (req.session?.bookVisitJourney?.prisonId && !req.session.bookVisitJourney.prison) {
      const prison = await prisonService.getPrison(req.session.bookVisitJourney.prisonId)
      req.session.bookVisitJourney.prison = prison
    }

    if (req.session?.bookVisitConfirmed?.prisonId && !req.session.bookVisitConfirmed.prison) {
      const prison = await prisonService.getPrison(req.session.bookVisitConfirmed.prisonId)
      req.session.bookVisitConfirmed.prison = prison
    }

    next()
  }
}
