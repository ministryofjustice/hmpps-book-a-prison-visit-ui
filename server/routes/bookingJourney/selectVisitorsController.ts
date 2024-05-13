import type { RequestHandler } from 'express'
import { ValidationChain, body, validationResult } from 'express-validator'
import { BookerService, PrisonService } from '../../services'

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

      res.render('pages/bookingJourney/selectVisitors', {
        prison: bookingJourney.prison,
        visitors: bookingJourney.allVisitors,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        throw new Error(JSON.stringify(errors.array())) // TODO add error messages to form
      }

      const { bookingJourney } = req.session
      const { visitorIds }: { visitorIds: number[] } = req.body

      const selectedVisitors = bookingJourney.allVisitors.filter(visitor => visitorIds.includes(visitor.personId))

      bookingJourney.selectedVisitors = selectedVisitors

      res.redirect('/book-a-visit/select-date-and-time')
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('visitorIds').toArray().toInt(),
      body('visitorIds').isArray({ min: 1 }).withMessage('No visitors selected'),
      // TODO check that it is a valid visitor ID
    ]
  }
}
