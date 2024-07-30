import type { RequestHandler } from 'express'
import { ValidationChain, matchedData, param, validationResult } from 'express-validator'
import { BookerService } from '../../services'
import getPrisonInformation from '../../constants/prisonInformation'
import paths from '../../constants/paths'

export default class BookingDetailsController {
  public constructor(private readonly bookerService: BookerService) {}

  public viewFuture(): RequestHandler {
    return async (req, res) => {
      const { booker, bookingsFuture } = req.session

      const errors = validationResult(req)
      if (!errors.isEmpty() || !bookingsFuture?.length) {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      const prisoner = booker.prisoners?.[0]
        ? booker.prisoners?.[0]
        : (await this.bookerService.getPrisoners(booker.reference))?.[0]

      const { visitNumber } = matchedData<{ visitNumber: number }>(req)
      // if manual number entered (larger than current number of visits in session data)
      // redirect to bookings page
      if (visitNumber > bookingsFuture.length) {
        return res.redirect(paths.BOOKINGS.HOME)
      }
      const visit = bookingsFuture[visitNumber - 1]

      const { prisonName, prisonPhoneNumber, prisonWebsite } = getPrisonInformation(visit.prisonId)

      return res.render('pages/bookings/visit', {
        visit,
        booker,
        prisoner,
        prisonName,
        prisonPhoneNumber,
        prisonWebsite,
        fromController: 'future',
        showServiceNav: true,
      })
    }
  }

  public viewPast(): RequestHandler {
    return async (req, res) => {
      const { booker, bookingsPast } = req.session

      const errors = validationResult(req)
      if (!errors.isEmpty() || !bookingsPast?.length) {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      const prisoner = booker.prisoners?.[0]
        ? booker.prisoners?.[0]
        : (await this.bookerService.getPrisoners(booker.reference))?.[0]

      const { visitNumber } = matchedData<{ visitNumber: number }>(req)
      // if manual number entered (larger than current number of visits in session data)
      // redirect to bookings page
      if (visitNumber > bookingsPast.length) {
        return res.redirect(paths.BOOKINGS.HOME)
      }
      const visit = bookingsPast[visitNumber - 1]

      const { prisonName, prisonPhoneNumber, prisonWebsite } = getPrisonInformation(visit.prisonId)

      return res.render('pages/bookings/visit', {
        visit,
        booker,
        prisoner,
        prisonName,
        prisonPhoneNumber,
        prisonWebsite,
        fromController: 'past',
        showServiceNav: true,
      })
    }
  }

  public viewCancelled(): RequestHandler {
    return async (req, res) => {
      const { booker, bookingsCancelled } = req.session

      const errors = validationResult(req)
      if (!errors.isEmpty() || !bookingsCancelled?.length) {
        return res.redirect(paths.BOOKINGS.HOME)
      }

      const prisoner = booker.prisoners?.[0]
        ? booker.prisoners?.[0]
        : (await this.bookerService.getPrisoners(booker.reference))?.[0]

      const { visitNumber } = matchedData<{ visitNumber: number }>(req)
      // if manual number entered (larger than current number of visits in session data)
      // redirect to bookings page
      if (visitNumber > bookingsCancelled.length) {
        return res.redirect(paths.BOOKINGS.HOME)
      }
      const visit = bookingsCancelled[visitNumber - 1]

      const { prisonName, prisonPhoneNumber, prisonWebsite } = getPrisonInformation(visit.prisonId)

      return res.render('pages/bookings/visit', {
        visit,
        booker,
        prisoner,
        prisonName,
        prisonPhoneNumber,
        prisonWebsite,
        fromController: 'cancelled',
        showServiceNav: true,
      })
    }
  }

  public validate(): ValidationChain[] {
    return [param('visitNumber').toInt().isInt({ min: 1 })]
  }
}
