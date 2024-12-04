import type { RequestHandler } from 'express'
import { NotFound } from 'http-errors'
import paths from '../../constants/paths'
import { clearSession } from '../../utils/utils'
import { BookerService } from '../../services'

export default class SelectPrisonerController {
  public constructor(private readonly bookerService: BookerService) {}

  public selectPrisoner(): RequestHandler {
    return async (req, res) => {
      clearSession(req)

      const { booker } = req.session
      const prisoner = booker.prisoners[0]

      const { prisonerDisplayId } = req.body
      if (prisonerDisplayId !== prisoner.prisonerDisplayId) {
        throw new NotFound('Prisoner not found')
      }

      req.session.bookingJourney = { prisoner }

      const prisonerIsValid = await this.bookerService.validatePrisoner(booker.reference, prisoner.prisonerNumber)
      if (!prisonerIsValid) {
        req.session.bookingJourney.cannotBookReason = 'TRANSFER_OR_RELEASE'
        return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
      }

      if (prisoner.availableVos <= 0) {
        req.session.bookingJourney.cannotBookReason = 'NO_VO_BALANCE'
        return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
      }

      return res.redirect(paths.BOOK_VISIT.SELECT_VISITORS)
    }
  }
}
