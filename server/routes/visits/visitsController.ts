import type { RequestHandler } from 'express'
import createError from 'http-errors'
import { BookerService, VisitService } from '../../services'
import { VisitDetails } from '../../services/visitService'
import { BookedVisits } from '../../@types/bapv'
import { clearSession } from '../../utils/utils'
import { getVisitDetailsSummaries } from './visitsUtils'

export default class VisitsController {
  public constructor(
    private readonly visitService: VisitService,
    private readonly bookerService: BookerService,
  ) {}

  public view(type: BookedVisits['type']): RequestHandler {
    return async (req, res, next) => {
      clearSession(req)

      const booker = req.session.booker!
      booker.prisoners = await this.bookerService.getPrisoners(booker.reference)

      let visits: VisitDetails[]

      switch (type) {
        case 'future':
          visits = await this.visitService.getFuturePublicVisits(booker.reference)
          break

        case 'past':
          visits = await this.visitService.getPastPublicVisits(booker.reference)
          break

        case 'cancelled':
          visits = await this.visitService.getCancelledPublicVisits(booker.reference)
          break

        default:
          return next(createError(500, `Invalid visits type: ${type}`))
      }

      req.session.bookedVisits = { type, visits }
      const visitDetailsSummaries = getVisitDetailsSummaries({ prisoners: booker.prisoners, visits })

      return res.render(`pages/visits/${type}`, {
        bookerHasPrisoners: booker.prisoners.length > 0,
        visits: visitDetailsSummaries,
        showOLServiceNav: true,
      })
    }
  }
}
