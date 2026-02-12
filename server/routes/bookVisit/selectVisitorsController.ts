import type { RequestHandler } from 'express'
import { Meta, ValidationChain, body, matchedData, validationResult } from 'express-validator'
import { differenceInYears } from 'date-fns'
import { BookerService, VisitSessionsService } from '../../services'
import { pluralise } from '../../utils/utils'
import paths from '../../constants/paths'
import { buildVisitorRequestsTableRows } from '../visitors/visitorsUtils'

export default class SelectVisitorsController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly visitSessionService: VisitSessionsService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker, bookVisitJourney } = req.session
      const { prison, prisoner } = bookVisitJourney

      // only request visitors once per journey so random visitor UUIDs don't change
      if (!bookVisitJourney.eligibleVisitors) {
        const visitorsByEligibility = await this.bookerService.getVisitorsByEligibility({
          bookerReference: booker.reference,
          prisonerNumber: prisoner.prisonerNumber,
          policyNoticeDaysMax: prison.policyNoticeDaysMax,
        })
        bookVisitJourney.eligibleVisitors = visitorsByEligibility.eligibleVisitors
        bookVisitJourney.ineligibleVisitors = visitorsByEligibility.ineligibleVisitors
      }

      const isAtLeastOneAdultVisitor = bookVisitJourney.eligibleVisitors.some(visitor => visitor.adult)
      if (bookVisitJourney.eligibleVisitors.length && !isAtLeastOneAdultVisitor) {
        req.session.bookVisitJourney.cannotBookReason = 'NO_ELIGIBLE_ADULT_VISITOR'
        return res.redirect(paths.BOOK_VISIT.CANNOT_BOOK)
      }

      const selectedVisitorDisplayIds = {
        visitorDisplayIds: bookVisitJourney.selectedVisitors?.map(visitor => visitor.visitorDisplayId) ?? [],
      }
      const formValues = {
        ...selectedVisitorDisplayIds,
        ...req.flash('formValues')?.[0],
      }

      let visitorRequestsTableRows
      if (bookVisitJourney.eligibleVisitors.length === 0) {
        const visitorRequests = await this.bookerService.getVisitorRequests({
          bookerReference: booker.reference,
          prisonerNumber: prisoner.prisonerNumber,
        })
        visitorRequestsTableRows = buildVisitorRequestsTableRows(visitorRequests)
      }

      return res.render('pages/bookVisit/selectVisitors', {
        errors: req.flash('errors'),
        formValues,
        prison,
        eligibleVisitors: bookVisitJourney.eligibleVisitors,
        ineligibleVisitors: bookVisitJourney.ineligibleVisitors,
        visitorRequestsTableRows,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect(paths.BOOK_VISIT.SELECT_VISITORS)
      }

      const { bookVisitJourney } = req.session
      const { visitorDisplayIds } = matchedData<{ visitorDisplayIds: string[] }>(req)

      const selectedVisitors = bookVisitJourney.eligibleVisitors.filter(visitor =>
        visitorDisplayIds.includes(visitor.visitorDisplayId),
      )

      bookVisitJourney.selectedVisitors = selectedVisitors

      const sessionRestriction = await this.visitSessionService.getSessionRestriction({
        prisonerId: bookVisitJourney.prisoner.prisonerNumber,
        visitorIds: selectedVisitors.map(visitor => visitor.visitorId),
      })
      bookVisitJourney.sessionRestriction = sessionRestriction

      return res.redirect(sessionRestriction === 'OPEN' ? paths.BOOK_VISIT.CHOOSE_TIME : paths.BOOK_VISIT.CLOSED_VISIT)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('visitorDisplayIds')
        .toArray()
        .isUUID()
        // filter out any invalid or duplicate visitorDisplayId values
        .customSanitizer((visitorDisplayIds: string[], { req }: Meta & { req: Express.Request }) => {
          const allVisitorDisplaysIds = req.session.bookVisitJourney.eligibleVisitors.map(
            visitor => visitor.visitorDisplayId,
          )

          const validVisitorDisplayIds = visitorDisplayIds.filter(visitorDisplayId =>
            allVisitorDisplaysIds.includes(visitorDisplayId),
          )
          const uniqueVisitorDisplayIds = new Set(validVisitorDisplayIds)

          return [...uniqueVisitorDisplayIds]
        })
        .isArray({ min: 1 })
        .withMessage('No visitors selected')
        .bail()
        // validate visitor totals
        .custom((visitorDisplayIds: string[], { req }: Meta & { req: Express.Request }) => {
          const { adultAgeYears, maxAdultVisitors, maxChildVisitors, maxTotalVisitors } =
            req.session.bookVisitJourney.prison

          // max total visitors
          if (visitorDisplayIds.length > maxTotalVisitors) {
            throw new Error(`Select no more than ${maxTotalVisitors} visitors`)
          }

          // calculate selected visitor ages
          const { eligibleVisitors } = req.session.bookVisitJourney
          const today = new Date()
          const visitorAges: number[] = visitorDisplayIds.map(visitorDisplayId => {
            const { dateOfBirth } = eligibleVisitors.find(v => v.visitorDisplayId === visitorDisplayId)
            return differenceInYears(today, dateOfBirth)
          })

          // max 'adult age' visitors
          const numAdultVisitors = visitorAges.filter(age => age >= adultAgeYears).length
          if (numAdultVisitors > maxAdultVisitors) {
            throw new Error(
              `Select no more than ${maxAdultVisitors} ${pluralise('visitor', maxAdultVisitors)} ` +
                `${adultAgeYears} ${pluralise('year', adultAgeYears)} old or older`,
            )
          }

          // max 'child age' visitors
          const numChildVisitors = visitorAges.filter(age => age < adultAgeYears).length
          if (numChildVisitors > maxChildVisitors) {
            throw new Error(
              `Select no more than ${maxChildVisitors} ${pluralise('visitor', maxChildVisitors)} ` +
                `under ${adultAgeYears} ${pluralise('year', adultAgeYears)} old`,
            )
          }

          // at least one visitor over 18
          if (!visitorAges.some(age => age >= 18)) {
            throw new Error('Add a visitor who is 18 years old or older')
          }

          return true
        }),
    ]
  }
}
