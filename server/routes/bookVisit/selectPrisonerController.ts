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

      const validationResult = await this.bookerService.validatePrisoner(booker.reference, prisoner.prisonerNumber)

      const prisonerHasVOsOrRemand = prisoner.availableVos > 0 || prisoner.convictedStatus === 'Remand'
      if (validationResult === true && prisonerHasVOsOrRemand) {
        return res.redirect(paths.BOOK_VISIT.SELECT_VISITORS)
      }

      if (
        validationResult === 'PRISONER_RELEASED' ||
        validationResult === 'PRISONER_TRANSFERRED_SUPPORTED_PRISON' ||
        validationResult === 'PRISONER_TRANSFERRED_UNSUPPORTED_PRISON'
      ) {
        req.session.bookingJourney.cannotBookReason = 'TRANSFER_OR_RELEASE'
      }

      if (validationResult === 'REGISTERED_PRISON_NOT_SUPPORTED') {
        req.session.bookingJourney.cannotBookReason = 'UNSUPPORTED_PRISON'
      }

      if (validationResult === true) {
        req.session.bookingJourney.cannotBookReason = 'NO_VO_BALANCE'
      }

      return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
    }
  }
}
