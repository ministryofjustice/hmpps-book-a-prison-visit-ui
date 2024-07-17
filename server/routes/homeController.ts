import type { RequestHandler } from 'express'
import { BookerService } from '../services'

export default class HomeController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { booker } = req.session
      const prisoners = await this.bookerService.getPrisoners(booker.reference)
      booker.prisoners = prisoners

      res.render('pages/home', { prisoners: booker.prisoners, showServiceNav: true })
    }
  }
}
