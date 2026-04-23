import type { RequestHandler } from 'express'
import { ValidationChain, body, matchedData, validationResult } from 'express-validator'
import { differenceInYears } from 'date-fns'
import { UUID } from 'crypto'
import { BookerService, VisitSessionsService } from '../../services'
import paths from '../../constants/paths'
import { buildVisitorRequestsTableRows } from '../visitors/visitorsUtils'
import type { Locale } from '../../constants/locales'

export default class SelectVisitorsController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly visitSessionService: VisitSessionsService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const booker = req.session.booker!
      const bookVisitJourney = req.session.bookVisitJourney!
      const prison = bookVisitJourney.prison!
      const { prisoner } = bookVisitJourney

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
        bookVisitJourney.cannotBookReason = 'NO_ELIGIBLE_ADULT_VISITOR'
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
        visitorRequestsTableRows = buildVisitorRequestsTableRows({
          visitors: visitorRequests,
          lng: req.language as Locale,
        })
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

      const bookVisitJourney = req.session.bookVisitJourney!
      const { visitorDisplayIds } = matchedData<{ visitorDisplayIds: string[] }>(req)

      const selectedVisitors = bookVisitJourney.eligibleVisitors!.filter(visitor =>
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
        .customSanitizer((visitorDisplayIds: UUID[], { req }) => {
          const allVisitorDisplaysIds = (req as Express.Request).session.bookVisitJourney!.eligibleVisitors!.map(
            visitor => visitor.visitorDisplayId,
          )

          const validVisitorDisplayIds = visitorDisplayIds.filter(visitorDisplayId =>
            allVisitorDisplaysIds.includes(visitorDisplayId),
          )
          const uniqueVisitorDisplayIds = new Set(validVisitorDisplayIds)

          return [...uniqueVisitorDisplayIds]
        })
        .isArray({ min: 1 })
        .withMessage((_value, { req }) => req.t('validation:visitorsNoneSelected'))
        .bail()
        // validate visitor totals
        .custom((visitorDisplayIds: string[], { req }) => {
          const bookVisitJourney = (req as Express.Request).session.bookVisitJourney!

          const { adultAgeYears, maxAdultVisitors, maxChildVisitors, maxTotalVisitors } = bookVisitJourney.prison!

          // max total visitors
          if (visitorDisplayIds.length > maxTotalVisitors) {
            throw new Error(req.t('validation:visitorsTooMany', { count: maxTotalVisitors }))
          }

          // calculate selected visitor ages
          const eligibleVisitors = bookVisitJourney.eligibleVisitors!
          const today = new Date()
          const visitorAges: number[] = visitorDisplayIds.map(visitorDisplayId => {
            const visitor = eligibleVisitors.find(v => v.visitorDisplayId === visitorDisplayId)
            return visitor?.dateOfBirth ? differenceInYears(today, visitor.dateOfBirth) : 0
          })

          // max 'adult age' visitors
          const numAdultVisitors = visitorAges.filter(age => age >= adultAgeYears).length
          if (numAdultVisitors > maxAdultVisitors) {
            throw new Error(req.t('validation:visitorsAdultsTooMany', { count: maxAdultVisitors, age: adultAgeYears }))
          }

          // max 'child age' visitors
          const numChildVisitors = visitorAges.filter(age => age < adultAgeYears).length
          if (numChildVisitors > maxChildVisitors) {
            throw new Error(
              req.t('validation:visitorsChildrenTooMany', { count: maxChildVisitors, age: adultAgeYears }),
            )
          }

          // at least one visitor over 18
          if (!visitorAges.some(age => age >= 18)) {
            throw new Error(req.t('validation:visitorsNeedAdult'))
          }

          return true
        }),
    ]
  }
}
