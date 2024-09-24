import type { RequestHandler } from 'express'
import { Meta, ValidationChain, body, matchedData, validationResult } from 'express-validator'
import { differenceInYears } from 'date-fns'
import { BookerService, PrisonService, VisitSessionsService } from '../../services'
import { pluralise } from '../../utils/utils'
import paths from '../../constants/paths'

export default class SelectVisitorsController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly prisonService: PrisonService,
    private readonly visitSessionService: VisitSessionsService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker, bookingJourney } = req.session

      if (!bookingJourney.prison) {
        ;[bookingJourney.prison, bookingJourney.eligibleVisitors] = await Promise.all([
          this.prisonService.getPrison(bookingJourney.prisoner.prisonId),
          this.bookerService.getEligibleVisitors(booker.reference, booker.prisoners[0].prisonerNumber),
        ])
      }

      const selectedVisitorDisplayIds = {
        visitorDisplayIds: bookingJourney.selectedVisitors?.map(visitor => visitor.visitorDisplayId) ?? [],
      }
      const formValues = {
        ...selectedVisitorDisplayIds,
        ...req.flash('formValues')?.[0],
      }

      res.render('pages/bookVisit/selectVisitors', {
        errors: req.flash('errors'),
        formValues,
        prison: bookingJourney.prison,
        visitors: bookingJourney.eligibleVisitors,
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

      const { bookingJourney } = req.session
      const { visitorDisplayIds } = matchedData<{ visitorDisplayIds: string[] }>(req)

      const selectedVisitors = bookingJourney.eligibleVisitors.filter(visitor =>
        visitorDisplayIds.includes(visitor.visitorDisplayId),
      )

      bookingJourney.selectedVisitors = selectedVisitors

      const sessionRestriction = await this.visitSessionService.getSessionRestriction({
        prisonerId: bookingJourney.prisoner.prisonerNumber,
        visitorIds: selectedVisitors.map(visitor => visitor.visitorId),
      })
      bookingJourney.sessionRestriction = sessionRestriction

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
          const allVisitorDisplaysIds = req.session.bookingJourney.eligibleVisitors.map(
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
            req.session.bookingJourney.prison

          // max total visitors
          if (visitorDisplayIds.length > maxTotalVisitors) {
            throw new Error(`Select no more than ${maxTotalVisitors} visitors`)
          }

          // calculate selected visitor ages
          const { eligibleVisitors } = req.session.bookingJourney
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
