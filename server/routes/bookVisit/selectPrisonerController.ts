import type { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { SessionData } from 'express-session'
import paths from '../../constants/paths'
import { clearSession } from '../../utils/utils'
import { BookerService } from '../../services'
import { BookVisitJourney } from '../../@types/bapv'

export default class SelectPrisonerController {
  public constructor(private readonly bookerService: BookerService) {}

  // Transfer and released
  private readonly EXCLUDED_LOCATIONS = ['TRN', 'OUT']

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisoners } = req.session.booker!
      const { bookVisitJourney } = req.session

      const formValues = bookVisitJourney?.prisoner
        ? { prisonerDisplayId: bookVisitJourney.prisoner.prisonerDisplayId }
        : {}

      return res.render('pages/bookVisit/selectPrisoner', {
        errors: req.flash('errors'),
        formValues,
        prisoners,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect(paths.BOOK_VISIT.SELECT_PRISONER)
      }

      clearSession(req) // TODO need to review this - need to support coming back to this page DURING a journey

      const booker = req.session.booker!
      const { prisonerDisplayId } = matchedData<{ prisonerDisplayId: string }>(req)
      const prisoner = booker.prisoners.find(p => p.prisonerDisplayId === prisonerDisplayId)!

      const bookVisitJourney: BookVisitJourney = { prisoner }
      req.session.bookVisitJourney = bookVisitJourney

      // if prisoner is not currently in registered prison or an excluded location, send to confirm location route
      if (
        prisoner.prisonId !== prisoner.registeredPrisonId &&
        !this.EXCLUDED_LOCATIONS.includes(prisoner.prisonId ?? '')
      ) {
        return res.redirect(paths.PRISONER_MOVED.CONFIRM_LOCATION)
      }

      const prisonerValidationResponse = await this.bookerService.validatePrisoner(
        booker.reference,
        prisoner.prisonerNumber,
      )
      const prisonerHasVOsOrRemand = prisoner.availableVos > 0 || prisoner.convictedStatus === 'Remand'

      if (prisonerValidationResponse === true && prisonerHasVOsOrRemand) {
        bookVisitJourney.prisonId = prisoner.prisonId!
        return res.redirect(paths.BOOK_VISIT.SELECT_VISITORS)
      }

      switch (prisonerValidationResponse) {
        case 'PRISONER_RELEASED':
        case 'PRISONER_TRANSFERRED_SUPPORTED_PRISON':
        case 'PRISONER_TRANSFERRED_UNSUPPORTED_PRISON':
          bookVisitJourney.cannotBookReason = 'TRANSFER_OR_RELEASE'
          break

        case 'REGISTERED_PRISON_NOT_SUPPORTED':
          bookVisitJourney.cannotBookReason = 'UNSUPPORTED_PRISON'
          break

        case true:
          bookVisitJourney.cannotBookReason = 'NO_VO_BALANCE'
          break

        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const unhandledCase: never = prisonerValidationResponse
        }
      }

      return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('prisonerDisplayId', (_value, { req }) => req.t('validation:prisonerSelectNone'))
        .isUUID()
        .bail()
        .custom((prisonerDisplayId: string, { req }) => {
          const { booker } = req.session as SessionData
          return booker?.prisoners.some(prisoner => prisoner.prisonerDisplayId === prisonerDisplayId)
        }),
    ]
  }
}
