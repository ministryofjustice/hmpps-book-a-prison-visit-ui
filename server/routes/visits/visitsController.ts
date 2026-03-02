import type { RequestHandler } from 'express'
import createError from 'http-errors'
import { BookerService, VisitService } from '../../services'
import { VisitDetails } from '../../services/visitService'
import { BookedVisits } from '../../@types/bapv'

export default class VisitsController {
  public constructor(
    private readonly visitService: VisitService,
    private readonly bookerService: BookerService,
  ) {}

  public home(): RequestHandler {
    return async (req, res, next) => {
      const booker = req.session.booker!
      booker.prisoners = await this.bookerService.getPrisoners(booker.reference)

      // if no prisoners, do not look for future
      const visits = booker.prisoners.length ? await this.visitService.getFuturePublicVisits(booker.reference) : [] 

      req.session.bookedVisits = { type: 'future', visits }

      return res.render(`pages/visits/future`, { prisoner: booker.prisoners[0], visits, showOLServiceNav: true })
    }
  }

  public view(type: BookedVisits['type']): RequestHandler {
    return async (req, res, next) => {
      const booker = req.session.booker!

      let visits: VisitDetails[]
      switch (type) {
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

      return res.render(`pages/visits/${type}`, { visits, showOLServiceNav: true })
    }
  }
}
