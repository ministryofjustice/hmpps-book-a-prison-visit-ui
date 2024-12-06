import type { RequestHandler } from 'express'
import { SessionData } from 'express-session'
import createError from 'http-errors'
import { BookerService, VisitService } from '../../services'
import { VisitDetails } from '../../services/visitService'

export default class BookingsController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly visitService: VisitService,
  ) {}

  public view(type: SessionData['bookings']['type']): RequestHandler {
    return async (req, res, next) => {
      const { booker } = req.session
      const prisoner = booker.prisoners[0]

      let visits: VisitDetails[]
      const viewContext: Record<string, unknown> = { showTransferOrReleaseBanner: false, showServiceNav: true }

      switch (type) {
        case 'future':
          visits = await this.visitService.getFuturePublicVisits(booker.reference)

          if (
            prisoner &&
            (await this.bookerService.isPrisonerTransferredOrReleased(booker.reference, prisoner.prisonerNumber))
          ) {
            viewContext.prisoner = prisoner
            viewContext.showTransferOrReleaseBanner = true
          }
          break

        case 'past':
          visits = await this.visitService.getPastPublicVisits(booker.reference)
          break

        case 'cancelled':
          visits = await this.visitService.getCancelledPublicVisits(booker.reference)
          break

        default:
          return next(createError(500, `Invalid bookings type: ${type}`))
      }

      req.session.bookings = { type, visits }
      viewContext.visits = visits

      return res.render(`pages/bookings/${type}`, viewContext)
    }
  }
}
