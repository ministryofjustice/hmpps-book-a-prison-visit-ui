import type { RequestHandler } from 'express'
import { Meta, ValidationChain, body, validationResult } from 'express-validator'
import { differenceInYears } from 'date-fns'
import { BookerService, PrisonService } from '../../services'
import { pluralise } from '../../utils/utils'

export default class SelectVisitorsController {
  public constructor(
    private readonly bookerService: BookerService,
    private readonly prisonService: PrisonService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker, bookingJourney } = req.session

      if (!bookingJourney.prison) {
        ;[bookingJourney.prison, bookingJourney.allVisitors] = await Promise.all([
          this.prisonService.getPrison(bookingJourney.prisoner.prisonCode),
          this.bookerService.getVisitors(booker.reference, booker.prisoners[0].prisonerNumber),
        ])
      }

      // TODO pre-populate form (e.g. if coming from Back link or Change answers)

      res.render('pages/bookVisit/selectVisitors', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0] || {},
        prison: bookingJourney.prison,
        visitors: bookingJourney.allVisitors,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        req.flash('formValues', req.body)
        return res.redirect('/book-visit/select-visitors')
      }

      const { bookingJourney } = req.session
      const { visitorDisplayIds }: { visitorDisplayIds: number[] } = req.body

      const selectedVisitors = bookingJourney.allVisitors.filter(visitor =>
        visitorDisplayIds.includes(visitor.visitorDisplayId),
      )

      bookingJourney.selectedVisitors = selectedVisitors

      return res.redirect('/book-visit/choose-visit-time')
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('visitorDisplayIds')
        .toArray()
        .toInt()
        // filter out any invalid or duplicate visitorDisplayId values
        .customSanitizer((visitorDisplayIds: number[], { req }: Meta & { req: Express.Request }) => {
          const allVisitorDisplaysIds = req.session.bookingJourney.allVisitors.map(visitor => visitor.visitorDisplayId)

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
        .custom((visitorDisplayIds: number[], { req }: Meta & { req: Express.Request }) => {
          const { adultAgeYears, maxAdultVisitors, maxChildVisitors, maxTotalVisitors } =
            req.session.bookingJourney.prison

          // max total visitors
          if (visitorDisplayIds.length > maxTotalVisitors) {
            throw new Error(`Select no more than ${maxTotalVisitors} visitors`)
          }

          // calculate selected visitor ages
          const { allVisitors } = req.session.bookingJourney
          const today = new Date()
          const visitorAges: number[] = visitorDisplayIds.map(visitorDisplayId => {
            const { dateOfBirth } = allVisitors.find(v => v.visitorDisplayId === visitorDisplayId)
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
