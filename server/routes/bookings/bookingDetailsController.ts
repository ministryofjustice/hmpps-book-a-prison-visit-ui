import type { RequestHandler } from 'express'
import { Meta, ValidationChain, matchedData, param, validationResult } from 'express-validator'
import { SessionData } from 'express-session'
import { BookerService } from '../../services'
import getPrisonInformation from '../../constants/prisonInformation'
import paths from '../../constants/paths'

export default class BookingDetailsController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(type: SessionData['bookings']['type']): RequestHandler {
    return async (req, res) => {
      const { booker, bookings } = req.session
      const { visits } = bookings

      const errors = validationResult(req)
      if (!errors.isEmpty() || bookings.type !== type) {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      const prisoner = booker.prisoners?.[0]
        ? booker.prisoners?.[0]
        : (await this.bookerService.getPrisoners(booker.reference))?.[0]

      const { visitDisplayId } = matchedData<{ visitDisplayId: string }>(req)

      const visit = visits.find(v => v.visitDisplayId === visitDisplayId)

      const { prisonName, prisonPhoneNumber, prisonWebsite } = getPrisonInformation(prisoner.prisonId)

      return res.render('pages/bookings/visit', {
        visit,
        booker,
        prisoner,
        prisonName,
        prisonPhoneNumber,
        prisonWebsite,
        type,
        showServiceNav: true,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [
      param('visitDisplayId')
        .isUUID()
        .bail()
        .custom((visitDisplayId: string, { req }: Meta & { req: Express.Request }) => {
          const { bookings } = req.session
          const visits = bookings?.visits ?? []

          return visits.some(visit => visit.visitDisplayId === visitDisplayId)
        }),
    ]
  }
}
