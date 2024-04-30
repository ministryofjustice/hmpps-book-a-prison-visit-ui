import type { RequestHandler } from 'express'
import { BookerService } from '../services'

export default class HomeController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session

      if (!booker.prisoners) {
        booker.prisoners = await this.bookerService.getPrisoners(booker.reference)
      }

      res.render('pages/home', { prisoners: booker.prisoners })
    }
  }
}
