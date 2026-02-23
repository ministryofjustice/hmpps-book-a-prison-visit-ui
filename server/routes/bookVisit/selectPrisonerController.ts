import type { RequestHandler } from 'express'
import { NotFound } from 'http-errors'
import paths from '../../constants/paths'
import { clearSession } from '../../utils/utils'
import { BookerService, PrisonService } from '../../services'
import { BookVisitJourney } from '../../@types/bapv'

export default class SelectPrisonerController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly prisonService: PrisonService,
  ) {}

  public selectPrisoner(): RequestHandler {
    return async (req, res) => {
      clearSession(req)

      const { booker } = req.session
      const prisoner = booker.prisoners[0]
      const bookVisitJourney: BookVisitJourney = { prisoner }

      if (req.body?.prisonerDisplayId !== prisoner.prisonerDisplayId) {
        throw new NotFound('Prisoner not found')
      }

      req.session.bookVisitJourney = bookVisitJourney

      const validationResult = await this.bookerService.validatePrisoner(booker.reference, prisoner.prisonerNumber)
      const prisonerHasVOsOrRemand = prisoner.availableVos > 0 || prisoner.convictedStatus === 'Remand'

      if (validationResult === true && prisonerHasVOsOrRemand) {
        bookVisitJourney.prison = await this.prisonService.getPrison(prisoner.prisonId)
        return res.redirect(paths.BOOK_VISIT.SELECT_VISITORS)
      }

      if (
        validationResult === 'PRISONER_RELEASED' ||
        validationResult === 'PRISONER_TRANSFERRED_SUPPORTED_PRISON' ||
        validationResult === 'PRISONER_TRANSFERRED_UNSUPPORTED_PRISON'
      ) {
        bookVisitJourney.cannotBookReason = 'TRANSFER_OR_RELEASE'
      }

      if (validationResult === 'REGISTERED_PRISON_NOT_SUPPORTED') {
        bookVisitJourney.cannotBookReason = 'UNSUPPORTED_PRISON'
      }

      if (validationResult === true) {
        bookVisitJourney.cannotBookReason = 'NO_VO_BALANCE'
      }

      return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
    }
  }
}
