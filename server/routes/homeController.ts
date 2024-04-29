import type { RequestHandler } from 'express'
import { BookerService } from '../services'

export default class HomeController {
  public constructor(private readonly bookerService: BookerService) {}

  // TODO this should render a form with the Start button submitting form
  public view(): RequestHandler {
    return async (req, res) => {
      const { reference } = req.session.booker
      const prisoners = await this.bookerService.getPrisoners(reference)

      res.render('pages/home', { prisoners })
    }
  }

  // TODO post route starts booking journey by clearing session and populating 'prisoner'
}
